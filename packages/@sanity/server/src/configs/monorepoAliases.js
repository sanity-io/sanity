import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'

const MONOREPO_PATH = path.resolve(__dirname, '../../../../..')
const ALIASES_FILENAME = `${MONOREPO_PATH}/.webpack-aliases.json5`

function resolve(...segments) {
  return path.resolve(MONOREPO_PATH, ...segments)
}
export function getMonorepoAliases() {
  const defaultAliases = {
    '@sanity/ui': require.resolve('@sanity/ui'),
    'styled-components': require.resolve('styled-components'),
  }

  let aliasesContents = ''
  try {
    aliasesContents = fs.readFileSync(ALIASES_FILENAME, 'utf-8')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('WARNING: No path aliases found in `%s`', ALIASES_FILENAME, err.message)
  }
  const aliases = aliasesContents ? JSON5.parse(aliasesContents) : defaultAliases

  const all = Object.keys(aliases).reduce((acc, key, obj) => {
    acc[key] = resolve(aliases[key])
    return acc
  }, {})
  return all
}
