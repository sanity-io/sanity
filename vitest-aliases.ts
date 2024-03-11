import path from 'path'

import devAliases from './dev/aliases.cjs'

export function getAliases() {
  return resolveAliasPaths(devAliases)
}
function resolveAliasPaths(aliases: Record<string, string>) {
  const result: Record<string, string> = {}

  for (const [aliasPattern, aliasPath] of Object.entries(aliases)) {
    result[aliasPattern] = path.resolve(__dirname, aliasPath)
  }

  return result
}
