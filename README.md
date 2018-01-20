# pooled-thrift-client

A node Thrift client utilising a pool of service connections and improved error handling/recovery

## Example usage

Given a thrift file `calculator_service.thrift` with contents:
```thrift
service CalculatorService {
  void ping(),
  i32 add(1:i32 num1, 2:i32 num2)
}
```

Compile with the `thrift` command (installable via your package manager):
```sh
thrift --gen js:node calculator_service.thrift
```

This will produce JS definitions for your service, which can then be used to create a client:
```js
import CalculatorService from './CalculatorService';
import thriftClient, { AcquisitionTimeoutError, ConnectionTimeoutError } from 'pooled-thrift-client';

// host and port are mandatory see other config options in comments
const host = '127.0.0.1', port = 9000;
const client = thriftClient(CalculatorService, { max: 5 }, { host, port });

// use the client as you would a regular client, get pooling for free
client.add(1, 2).then(sum => console.log(sum));
```
