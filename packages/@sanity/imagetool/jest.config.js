module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**.js'],
  testRegex:
    '(src/(.*__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$)|(test/((.*\\.|/)(test|spec))\\.[jt]sx?$)',
}
