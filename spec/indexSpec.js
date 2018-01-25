const thriftClient = require('../src');

describe('pooledThriftClient', () => {
  beforeEach(() => {
    this.client = thriftClient();
  });
});
