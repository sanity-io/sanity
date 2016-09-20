'use strict'

const banner = [
  '/**',
  ' * Sanity part: PART_NAME',
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
  const implementations = opts.parts.implementations[opts.part]

  const result = banner
    .concat(normalizer)
    .concat(['\nmodule.exports = ['])
    .concat(implementations.map(
      (implementer, i) => `  require('${implementer.path}')`
    ).join(',\n'))
    .concat(['].map(normalize)\n'])
    .join('\n')
    .replace(/PART_NAME/g, opts.part)

  callback(null, result)
}
