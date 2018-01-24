import GenericPool from 'generic-pool';
import Thrift, { TBinaryProtocol, TFramedTransport } from 'thrift';

/* Error types */

export const AcquisitionTimeoutError = class extends Error {
  constructor(message, metadata = {}) {
    super(`Thrift pool connection acquisition timeout: ${message}`, metadata);
    this.name = 'AcquisitionTimeoutError';
    Error.captureStackTrace(this, AcquisitionTimeoutError);
  }
};

export const ConnectionTimeoutError = class extends Error {
  constructor() {
    super('Thrift connection timeout');
    this.name = 'ConnectionTimeoutError';
    Error.captureStackTrace(this, ConnectionTimeoutError);
  }
};

export const ConnectionClosedError = class extends Error {
  constructor() {
    super('Thrift connection closed');
    this.name = 'ConnectionClosedError';
    Error.captureStackTrace(this, ConnectionClosedError);
  }
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
  return new Promise((resolve, reject) => {
    const { host, port } = thriftOptions;
    const connection = Thrift.createConnection(host, port, thriftOptions);
    connection.alive = false; // add a property for validation purposes

    connection
      .on('connect', () => {
        connection.connection.setKeepAlive(true); // socket manipulation
        connection.alive = true;
        resolve(connection);
      })
      .on('timeout', () => reject(new ConnectionTimeoutError()))
      .on('close', () => reject(new ConnectionClosedError()))
      .on('error', reject);
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
    .then(connection => new Promise((resolve, reject) => {
      const onTimeout = () => {
        connection.alive = false;
        pool.release(connection);
        reject(new ConnectionTimeoutError());
      };
      const onClose = () => {
        connection.alive = false;
        pool.release(connection);
        reject(new ConnectionClosedError());
      };
      const onError = (error) => {
        connection.alive = false;
        pool.release(connection);
        reject(error);
      };
      connection.on('timeout', onTimeout).on('close', onClose).on('error', onError);

      const client = Thrift.createClient(TService, connection);
      const response = client[rpc](...args).finally(() => {
        connection.removeListener('timeout', onTimeout);
        connection.removeListener('close', onClose);
        connection.removeListener('error', onError);
        pool.release(connection);
      });
      resolve(response);
    }));
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
