const moduleAliases = require('./.module-aliases')
const path = require('path')

/**
 * Takes a list of path aliases and converts them into jest module mappings with some
 * custom handling
 * */
function jestify(aliases) {
  return Object.keys(aliases).reduce((acc, module) => {
    const target = aliases[module]
    if (target.endsWith('/_exports') || target.endsWith('__legacy/@sanity/components')) {
      acc[`^${module}/(.*)$`] = `${path.resolve(__dirname, aliases[module])}/$1`
      acc[`^${module}$`] = path.resolve(__dirname, aliases[module])
    } else {
      acc[`^${module}$`] = path.resolve(__dirname, aliases[module])
    }
    return acc
  }, {})
}

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
  testRegex:
    '(src/(.*__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$)|(test/((.*\\.|/)(test|spec))\\.[jt]sx?$)',
  moduleNameMapper: jestify({
    ...moduleAliases,
    'part:@sanity/components/fieldsets/default':
      './packages/@sanity/base/src/__legacy/@sanity/components/fieldsets/DefaultFieldset',
    'part:@sanity/components/formfields/default':
      './packages/@sanity/base/src/__legacy/@sanity/components/formfields/DefaultFormField',
    'part:@sanity/base/schema-creator': './packages/@sanity/base/src/schema/createSchema',
  }),
}
