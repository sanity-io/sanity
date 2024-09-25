import devAliases from './dev-aliases.cjs'

import {dirname, resolve} from 'node:path'

const PACKAGES_PATH = resolve(getDirname(import.meta.url), '..', '..')

function getDirname(importMetaUrl) {
  return dirname(importMetaUrl.replace('file://', ''))
}

export function getViteAliases() {
  return Object.fromEntries(
    Object.entries(devAliases).map(([packageName, aliasPath]) => [
      packageName,
      resolve(PACKAGES_PATH, aliasPath),
    ]),
  )
}
