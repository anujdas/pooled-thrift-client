const CalculatorService = require('./support/thrift/CalculatorService');
const thriftClient = require('../src');

describe('pooledThriftClient', () => {
  beforeEach(() => {
    this.clientOptions = { poolOptions: { min: 0, max: 1 } };
    this.thriftOptions = { host: '127.0.0.1', port: 9090 };
  });

  describe('constructor', () => {
    it('creates a client implementing all Service methods', () => {
      const client = thriftClient(CalculatorService, this.thriftOptions, this.clientOptions);
      expect(client.add).toBeDefined();
    });
  });
});
