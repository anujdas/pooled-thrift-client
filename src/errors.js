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

