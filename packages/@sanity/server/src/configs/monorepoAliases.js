import path from 'path'
import tsconfig from 'tsconfig'

const MONOREPO_PATH = path.resolve(__dirname, '../../../../..')

function resolve(...segments) {
  return path.resolve(MONOREPO_PATH, ...segments)
}

export function getMonorepoAliases() {
  const defaultAliases = {
    '@sanity/ui': require.resolve('@sanity/ui'),
    'styled-components': require.resolve('styled-components'),
  }

  try {
    // eslint-disable-next-line no-sync
    const result = tsconfig.loadSync(MONOREPO_PATH)
    const {compilerOptions} = result.config

    if (!compilerOptions.baseUrl || !compilerOptions.paths) {
      return defaultAliases
    }

    const pathEntries = Object.entries(compilerOptions.paths)
    const aliases = pathEntries.map(([key, value]) => [key, value[0]])

    return aliases.reduce((acc, [key, relativePath]) => {
      acc[key] = resolve(compilerOptions.baseUrl, relativePath)
      return acc
    }, defaultAliases)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('WARNING: failed to load paths from tsconfig.json in monorepo', err.message)
  }

  return defaultAliases
}
