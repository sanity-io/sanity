const banner = [
  '/**',
  ' * Sanity part: PART_NAME',
  ' * ',
  ' * Sanity plugin loader multi-implementation wrapper',
  ' * Imports all implementers, then exports them as an array',
  ' */',
]

const normalizer = [
  'function normalize(mod) {',
  '  return mod && mod.__esModule ? mod["default"] : mod',
  '}',
  '',
]

// Use JSON.stringify to ensure paths are proper strings
// (eg, if they contain a `\`, things will blow up without a proper serializer)
function pathToRequire(path) {
  return `  require(${JSON.stringify(path)})`
}

module.exports = function multiImplementationHandler(partName, implementations) {
  return banner
    .concat(normalizer)
    .concat(['\nmodule.exports = ['])
    .concat(implementations.reverse().map(pathToRequire).join(',\n'))
    .concat(['].map(normalize)\n'])
    .join('\n')
    .replace(/PART_NAME/g, partName)
}
