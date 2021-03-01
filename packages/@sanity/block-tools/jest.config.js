module.exports = {
  preset: 'ts-jest',
  testRegex: 'test\\/.*\\.test\\.ts$',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.ts'],
  collectCoverageFrom: ['src/**.ts'],
}
