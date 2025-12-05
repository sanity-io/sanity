import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import devAliases from './dev-aliases.cjs'

const PACKAGES_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function getViteAliases() {
  return Object.fromEntries(
    Object.entries(devAliases).map(([packageName, aliasPath]) => [
      packageName,
      resolve(PACKAGES_PATH, aliasPath),
    ]),
  )
}
