// Test thrift file for use in specs
// Install `thrift`, then compile with `thrift --gen js:node -out . calculator_service.thrift`

exception OutOfRange {
  1: string message
}

service CalculatorService {
  i32 add(1:i32 num1, 2:i32 num2) throws (1:OutOfRange out_of_range)
}
