// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {register, createRequire} from 'node:module'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {pathToFileURL} from 'node:url'

const require = createRequire(import.meta.url)

register(
  './mock-browser-env-stub-loader.mjs',
  pathToFileURL(require.resolve('sanity/package.json')),
)
