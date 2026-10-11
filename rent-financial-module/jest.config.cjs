const shared = require('./test/jest.shared.cjs');

module.exports = {
  ...shared,
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: [
    '**/*.ts',
    '!main.ts',
    '!**/*.module.ts',
    '!**/*types.ts',
  ],
  coverageDirectory: '../coverage',
};
