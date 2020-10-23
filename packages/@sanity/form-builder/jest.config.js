module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: 'test\\/.*\\.test\\.ts$',
  collectCoverageFrom: ['src/**.js'],
}
