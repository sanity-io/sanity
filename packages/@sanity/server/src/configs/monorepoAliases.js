import path from 'path'

const MONOREPO_PATH = path.resolve(__dirname, '../../../../..')
const ALIASES_FILENAME = `${MONOREPO_PATH}/.module-aliases`

export function getMonorepoAliases() {
  const defaultAliases = {
    '@sanity/ui': require.resolve('@sanity/ui'),
    'styled-components': require.resolve('styled-components'),
  }

  let moduleAliases = {}
  try {
    // eslint-disable-next-line import/no-dynamic-require
    moduleAliases = require(ALIASES_FILENAME)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('WARNING: No path aliases found in `%s`', ALIASES_FILENAME, err.message)
  }

  return {...defaultAliases, ...resolveAliases(moduleAliases)}
}

function resolve(...segments) {
  return path.resolve(MONOREPO_PATH, ...segments)
}
function resolveAliases(aliases) {
  return Object.keys(aliases).reduce((acc, module) => {
    acc[module] = resolve(aliases[module])
    return acc
  }, {})
}
