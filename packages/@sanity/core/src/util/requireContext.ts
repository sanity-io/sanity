/**
 * This file exposes a "register" function which hacks in a `require.context`function,
 * mirroring webpacks version (https://webpack.js.org/guides/dependency-management/#requirecontext)
 *
 * Basically allows you to do `require.context('./types', true, /\.js$/)` to import multiple
 * files at the same time. While generally not advised (given it's a webpack-only thing),
 * people are already using it in the wild, so it breaks when trying to deploy GraphQL APIs,
 * or when running scripts using `sanity exec`.
 *
 * We have to inject the `require.context` function to each required file, which is done by
 * overriding injecting a small script that runs before the start of each file.
 */

import path from 'path'
import {addHook} from 'pirates'

type Revert = ReturnType<typeof addHook>
let revert: Revert | undefined

const augmentRequire = (dirname: string) =>
  `if (typeof require !== 'undefined') {const {createRequireContext} = require('@sanity/core/_internal');require.context = createRequireContext(${JSON.stringify(
    dirname
  )});};`

export function register(): Revert {
  if (revert) return revert

  revert = addHook((code, filename) => `${augmentRequire(path.dirname(filename))}${code}`, {
    exts: ['.js', '.ts', '.tsx'],
    ignoreNodeModules: true,
  })

  return revert
}
