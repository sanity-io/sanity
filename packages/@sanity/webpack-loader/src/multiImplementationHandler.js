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

module.exports = function multiImplementationHandler(partName, implementations) {
  return banner
    .concat(normalizer)
    .concat(['\nmodule.exports = ['])
    .concat(implementations.reverse().map((implementer, i) => `  require('${implementer}')`).join(',\n'))
    .concat(['].map(normalize)\n'])
    .join('\n')
    .replace(/PART_NAME/g, partName)
}
