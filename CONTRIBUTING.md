# Contributing to pooled-thrift-client

## Bug Reports

* Ensure that your issue [has not already been reported][1]. It may already be
  fixed!
* Include the steps you carried out to produce the problem.
* Include the behavior you observed along with the behavior you expected, and
  why you expected it.
* Include the stack trace and any debugging output.

## Feature Requests

We welcome feedback with or without pull requests. If you have an idea for how
to improve the tool, great! All we ask is that you take the time to write a
clear and concise explanation of what need you are trying to solve. If you have
thoughts on _how_ it can be solved, include those too!

The best way to see a feature added, however, is to submit a pull request.

## Pull Requests

* Before creating your pull request, it's usually worth asking if the code
  you're planning on writing will actually be considered for merging. You can
  do this by [opening an issue][1] and asking. It may also help give the
  maintainers context for when the time comes to review your code.

* Ensure your [commit messages are well-written][2]. This can double as your
  pull request message, so it pays to take the time to write a clear message.

* Add tests for your feature. Run them using `npm test`.

* Verify that your code passes the linter. Run it using `npm run lint`.

* Submit your pull request!

All pull requests will be tested against [Travis CI][3], where the following
commands are run against multiple versions of Node:

```bash
npm run lint
npm test
```

Ensuring your changes pass for the above commands before submitting your pull
request will save you time having to fix those changes.

[1]: https://github.com/brigade/pooled-thrift-client/issues
[2]: https://medium.com/brigade-engineering/the-secrets-to-great-commit-messages-106fc0a92a25
[3]: https://travis-ci.org/

## Code of conduct

This project adheres to the [Open Code of Conduct][code-of-conduct]. By
participating, you are expected to honor this code.

[code-of-conduct]: https://github.com/brigade/code-of-conduct
