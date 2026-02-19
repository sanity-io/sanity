// @vitest-environment node
import {fileURLToPath} from 'node:url'

import {expect, it} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

const EXCLUDE = [
  // This is causing trouble if running without first "pnpm build"
  // also, it's internal, so not much point in tracking
  './_internal',
]

it('exports snapshot', async () => {
  const manifest = await getPackageExportsManifest({
    shouldIgnoreEntry: ({entry}) => {
      return EXCLUDE.includes(entry)
    },
    resolveExportsValue: (entry) => {
      if (typeof entry === 'string') {
        throw new Error('Expected entry to be an object')
      }
      return entry.source
    },
    importMode: 'src',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchSnapshot()
}, 60_000)
