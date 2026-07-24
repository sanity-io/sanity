import {register, createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'

const require = createRequire(import.meta.url)

register(
  './mock-browser-env-stub-loader.mjs',
  pathToFileURL(require.resolve('sanity/package.json')),
)
