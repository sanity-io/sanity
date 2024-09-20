import {dirname} from 'node:path'

export function resolveDirName(importMetaUrl) {
  return dirname(importMetaUrl.replace('file://', ''))
}
