# Changelog

## 2.0.0

- Really just a constructor change to make things more sensible, but in line
  with semver, we're now at 2.0.0.

## 1.1.1

- Make client object more meaningful by wrapping only actual RPC methods

## 1.0.0

- Initial release

## 1.0.1

- Add testing framework (jasmine)
- Move to @brigade org on npmjs.org

## 1.0.2

- Fix babel compilation and include runtime for normal usage

## 1.0.3

- Correctly release connections on error cases

## 1.1.0

- Fix potential multi-release of pooled connections resulting in unhandled
  Promise rejections
- Rework callback attach/detachment to eliminate edge cases
- Remove Babel and go native ES6 to fix bug in transpiled code
