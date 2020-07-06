# pooled-thrift-client

[![npm version](https://badge.fury.io/js/%40brigade%2Fpooled-thrift-client.svg)](https://badge.fury.io/js/%40brigade%2Fpooled-thrift-client)
[![Build Status](https://travis-ci.org/brigade/pooled-thrift-client.svg?branch=master)](https://travis-ci.org/brigade/pooled-thrift-client)

A node Thrift client utilising a pool of service connections and improved error handling/recovery

## Features

- proper Promise support in pool instance con/destruction
- correct behaviour on "Internal Error", aka, socket misalignment on
  unhandled server errors
- better/existent timeout support for: connections, pool checkout,
  execution
- builtin retry support using upstream Thrift code
- faster detection and pruning of dead connections
- async/await compatibility and other niceties
- enabled oneway function
- enable trace log with debug mod

## Example usage

Given a thrift file `calculator_service.thrift` with contents:
```thrift
exception OutOfRange {
  1: string message
}
service CalculatorService {
  i32 add(1:i32 num1, 2:i32 num2) throws (1:OutOfRange out_of_range)
}
```

Compile with the `thrift` command (installable via your package manager):
```sh
thrift --gen js:node calculator_service.thrift
```

This will produce JS definitions for your service, which can then be used to create a client:
```js
const CalculatorService = require('./CalculatorService');
const thriftClient = require('pooled-thrift-client');

// host and port are mandatory see other config options in comments
const host = '127.0.0.1', port = 9000;
const client = thriftClient(CalculatorService, { host, port }, { poolOptions: { max: 5 } });

// use the client as you would a regular client, get pooling for free
client.add(1, 2).then(sum => console.log(sum));
```

## Testing

Tests use the `calculator_service.thrift` example service located in
`spec/support/thrift`. A compiled version is committed to this repository; to
recompile it, install `thrift` using your package manager (e.g., `brew install
thrift`), then follow the instructions in the file.

Tests can be run using
```sh
npm test
```
