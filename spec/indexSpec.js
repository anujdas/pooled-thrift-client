import thriftClient from '../src';

describe('pooledThriftClient', () => {
  beforeEach(() => {
    this.client = thriftClient();
  });
});
