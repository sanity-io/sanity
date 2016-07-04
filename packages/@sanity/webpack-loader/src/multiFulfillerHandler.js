'use strict'

const banner = [
  '/**',
  ' * Sanity role: ROLE_NAME',
  ' * ',
  ' * Sanity plugin loader multi-fulfiller wrapper',
  ' * Imports all fulfillers, then exports them as an array',
  ' */'
]

const normalizer = [
  'function normalize(mod) {',
  '  return mod && mod.__esModule ? mod["default"] : mod',
  '}', ''
]

module.exports = function multiFulfillerHandler(opts, callback) {
  const fulfillers = opts.roles.fulfilled[opts.role]

  const result = banner
    .concat(normalizer)
    .concat(['\nmodule.exports = ['])
    .concat(fulfillers.map(
      (fulfiller, i) => `  require('${fulfiller.path}')`
    ).join(',\n'))
    .concat(['].map(normalize)\n'])
    .join('\n')
    .replace(/ROLE_NAME/g, opts.role)

  callback(null, result)
}
