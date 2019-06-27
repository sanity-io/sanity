module.exports = {
  testRegex: 'test\\/.*\\.test\\.js$',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.js'],
  collectCoverageFrom: ['src/**.js']
}
