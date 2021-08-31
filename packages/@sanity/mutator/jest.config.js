const aliases = require('../../../.module-aliases')

/** @type {import('@jest/types').Config.InitialOptions} */
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
  collectCoverageFrom: ['src/**.ts'],
  testRegex:
    '(src/(.*__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$)|(test/((.*\\.|/)(.+))\\.[jt]sx?$)',
  moduleNameMapper: aliases.jest,
}
