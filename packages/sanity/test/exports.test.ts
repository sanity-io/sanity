import {fileURLToPath} from 'node:url'

import {expect, it} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

const EXCLUDE = [
  // This is causing trouble if running without first "pnpm build"
  // also, it's internal, so not much point in tracking
  './lib/_internal.js',
]

it('exports snapshot', async () => {
  const manifest = await getPackageExportsManifest({
    resolveExportsValue: (entry) => {
      if (typeof entry === 'string') {
        throw new Error('Expected entry to be an object')
      }
      if (EXCLUDE.includes(entry.default)) {
        return undefined
      }
      return entry.source
    },
    importMode: 'src',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchSnapshot()
}, 60_000)
