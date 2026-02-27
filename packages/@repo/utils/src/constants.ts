import * as path from 'node:path'
import * as url from 'node:url'

export const MONOREPO_ROOT = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '../../../../',
)
