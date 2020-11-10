import path from 'path'
import tsconfig from 'tsconfig'

const MONOREPO_PATH = path.resolve(__dirname, '../../../../..')

function resolve(...segments) {
  return path.resolve(MONOREPO_PATH, ...segments)
}

export function getMonorepoAliases() {
  try {
    // eslint-disable-next-line no-sync
    const result = tsconfig.loadSync(MONOREPO_PATH)
    const {compilerOptions} = result.config

    if (!compilerOptions.baseUrl || !compilerOptions.paths) {
      return {}
    }

    const pathEntries = Object.entries(compilerOptions.paths)
    const aliases = pathEntries.map(([key, value]) => [key, value[0]])

    const aliasMap = aliases.reduce((acc, [key, relativePath]) => {
      acc[key] = resolve(compilerOptions.baseUrl, relativePath)
      return acc
    }, {})

    return aliasMap
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('WARNING: failed to load paths from tsconfig.json in monorepo', err.messagee)
  }

  return {}
}
