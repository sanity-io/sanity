// @ts-expect-error -- pre-existing, fix later
import {register, createRequire} from 'node:module'
// @ts-expect-error -- pre-existing, fix later
import {pathToFileURL} from 'node:url'

const require = createRequire(import.meta.url)

register(
  './mock-browser-env-stub-loader.mjs',
  pathToFileURL(require.resolve('sanity/package.json')),
)
