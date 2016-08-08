'use strict'

const banner = [
  '/**',
  ' * Sanity role: ROLE_NAME',
  ' * ',
  ' * Sanity plugin loader multi-implementation wrapper',
  ' * Imports all implementers, then exports them as an array',
  ' */'
]

const normalizer = [
  'function normalize(mod) {',
  '  return mod && mod.__esModule ? mod["default"] : mod',
  '}', ''
]

module.exports = function multiImplementationHandler(opts, callback) {
  const implementations = opts.roles.implementations[opts.role]

  const result = banner
    .concat(normalizer)
    .concat(['\nmodule.exports = ['])
    .concat(implementations.map(
      (implementer, i) => `  require('${implementer.path}')`
    ).join(',\n'))
    .concat(['].map(normalize)\n'])
    .join('\n')
    .replace(/ROLE_NAME/g, opts.role)

  callback(null, result)
}
