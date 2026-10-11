const shared = require('./jest.shared.cjs');

module.exports = {
  ...shared,
  rootDir: '..',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
};
