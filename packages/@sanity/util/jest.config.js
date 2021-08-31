const aliases = require('../../../.module-aliases')

module.exports = {
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              modules: 'commonjs',
              targets: {node: 'current'},
            },
          ],
          '@babel/typescript',
          '@babel/react',
        ],
      },
    ],
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**.js'],
  testRegex:
    '(src/(.*__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$)|(test/((.*\\.|/)(test|spec))\\.[jt]sx?$)',
  // Setup timezone
  moduleNameMapper: aliases.jest,
}
