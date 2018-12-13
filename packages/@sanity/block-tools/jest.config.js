module.exports = {
  transform: {'^.+\\.jsx?$': 'babel-jest'},
  testRegex: 'test\\/.*\\.test\\.js',
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './test/setup.js',
  collectCoverageFrom: ['src/**.js']
}
