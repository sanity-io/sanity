import {createRequire, registerHooks} from 'node:module'
import {pathToFileURL} from 'node:url'

const require = createRequire(import.meta.url)

const {load} = await import(
  new URL(
    './mock-browser-env-stub-loader.mjs',
    pathToFileURL(require.resolve('sanity/package.json')),
  ).href
)

registerHooks({load})
