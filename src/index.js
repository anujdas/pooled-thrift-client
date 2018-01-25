import GenericPool from 'generic-pool';
import Thrift, { TBinaryProtocol, TFramedTransport } from 'thrift';
import { AcquisitionTimeoutError, ConnectionTimeoutError, ConnectionClosedError } from './errors';

/* Callback handlers */

/**
 * Wraps a connection in event callbacks suitable for Promise use
 *
 * @param {Connection} connection A Thrift connection
 * @param {function} reject A Promise's reject function
 *
 * @return {Object} Three callbacks: onTimeout, onClose, onError
 */
const attachCallbacks = (connection, reject) => {
  const onTimeout = () => {
    connection.alive = false;
    reject(new ConnectionTimeoutError());
  };
  const onClose = () => {
    connection.alive = false;
    reject(new ConnectionClosedError());
  };
  const onError = (error) => {
    connection.alive = false;
    reject(error);
  };
  connection.on('timeout', onTimeout).on('close', onClose).on('error', onError);

  return { onTimeout, onClose, onError };
};


/**
 * Removes callbacks attached to a connection by attachCallbacks
 *
 * @param {Connection} connection A Thrift connection
 * @param {Object} callbacks The returned { onTimeout, onClose, onError } from attachCallbacks
 */
const detachCallbacks = (connection, { onTimeout, onClose, onError }) => {
  connection
    .removeListener('timeout', onTimeout)
    .removeListener('close', onClose)
    .removeListener('error', onError);
};

/* Constructors */

/**
 * Attempts to open a new persistent connection to a Thrift-RPC service
 *
 * @param {Object} thriftOptions Options passed directly to Thrift's createConnection()
 * @param {String} thriftOptions.host The hostname of the target service
 * @param {Integer} thriftOptions.port The port number of the target service
 *
 * @return {Promise} Resolves to an open connection or an error
 */
const createThriftConnection = (thriftOptions) => {
  let connection, callbacks;
  return new Promise((resolve, reject) => {
    const { host, port } = thriftOptions;
    connection = Thrift.createConnection(host, port, thriftOptions);
    connection.alive = false; // add a property for validation purposes
    callbacks = attachCallbacks(connection, reject);
    connection.on('connect', resolve);
  }).then(() => {
    detachCallbacks(connection, callbacks);
    connection.connection.setKeepAlive(true); // socket manipulation
    connection.alive = true; // state tracking
    return connection;
  }).catch((error) => {
    detachCallbacks(connection, callbacks);
    throw error;
  });
};

/**
 * Wraps an RPC with a connection pool and error handlers
 *
 * @param {ThriftService} TService The generated Service class to connect to
 * @param {String} rpc The method to call on the TService client
 * @param {GenericPool} pool The pool of ThriftConnections to use
 *
 * @return {Function} A callable taking arguments and returning a Promise for
 *   the RPC response or an error
 */
const pooledRpc = (TService, rpc, pool) => (...args) => {
  return pool.acquire()
    .catch(e => Promise.reject(new AcquisitionTimeoutError(e.message)))
    .then((connection) => {
      let callbacks;
      return new Promise((resolve, reject) => {
        callbacks = attachCallbacks(connection, reject);
        const client = Thrift.createClient(TService, connection);
        resolve(client[rpc](...args));
      }).then((response) => {
        detachCallbacks(connection, callbacks);
        pool.release(connection);
        return response;
      }).catch((error) => {
        detachCallbacks(connection, callbacks);
        pool.release(connection);
        throw error;
      });
    });
};

/* Default options */

const DEFAULT_POOL_OPTIONS = {
  max: 1,
  min: 0,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 10000,
  testOnBorrow: true,
  testOnReturn: true,
};

const DEFAULT_THRIFT_OPTIONS = {
  transport: TFramedTransport,
  protocol: TBinaryProtocol,
  connect_timeout: 1000,
  max_attempts: 3,
};

/* Entrypoint */

/**
 * Returns a Thrift client utilising a pool of service connections and good error recovery
 *
 * @param {ThriftService} TService The generated Service class to connect to
 * @param {Object} poolOptions Options passed directly to GenericPool's constructor; see
 *   https://github.com/coopernurse/node-pool/blob/71fc5582712dc5982d2b3987b84f9fbc93fe8501/lib/PoolOptions.js#L6-L47
 * @param {Object} thriftOptions Options passed directly to Thrift's createConnection(); see
 *   https://github.com/apache/thrift/blob/0a84eae1db28abb5e3ee730e8fa40a154c6e1097/lib/nodejs/lib/thrift/connection.js#L35
 * @param {String} thriftOptions.host The hostname of the target service
 * @param {Integer} thriftOptions.port The port number of the target service
 * @param {ThriftTransport} [thriftOptions.transport=TFramedTransport] Transport of target service
 * @param {ThriftProtocol} [thriftOptions.protocol=TBinaryProtocol] Protocol of target service
 * @param {Integer} [thriftOptions.connect_timeout=1000] Milliseconds to wait for connection
   * @param {Integer} [thriftOptions.timeout=null] Milliseconds to wait for each RPC, if set
 * @param {Integer} [thriftOptions.max_attempts=3] Number of times to attempt reconnection
 *
 * @return {Object} A client with methods corresponding to the TService
 */
export default function(TService, poolOptions, thriftOptions) {
  if (!thriftOptions.host || !thriftOptions.port) {
    throw new Error('PooledThriftClient: both host and port must be specified');
  }

  thriftOptions = Object.assign({}, DEFAULT_THRIFT_OPTIONS, thriftOptions);
  poolOptions = Object.assign({}, DEFAULT_POOL_OPTIONS, poolOptions);

  const pool = GenericPool.createPool({
    create: () => createThriftConnection(thriftOptions),
    validate: async connection => connection.alive && connection.connected,
    destroy: async connection => connection.end(),
  }, poolOptions);

  return Object.keys(TService.Client.prototype).reduce((thriftClient, rpc) => {
    thriftClient[rpc] = pooledRpc(TService, rpc, pool);
    return thriftClient;
  }, {});
}
export { AcquisitionTimeoutError, ConnectionTimeoutError, ConnectionClosedError };
