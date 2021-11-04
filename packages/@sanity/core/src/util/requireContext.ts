import path from 'path'
import {addHook} from 'pirates'

type Revert = ReturnType<typeof addHook>
let revert: Revert | undefined

// using `require.resolve` here grabs the absolute path of
// `@sanity/util/_internal` and inlines it into the `augmentRequire` script.
// note: this is required for internal repos that utilize symlinked versions of
// `@sanity/util`. (e.g. all the `examples/*` repos)
const utilInternalPath = require.resolve('@sanity/util/_internal')

const augmentRequire = (dirname: string) =>
  `if (typeof require !== 'undefined') {const {createRequireContext} = require(${JSON.stringify(
    utilInternalPath
  )});require.context = createRequireContext(${JSON.stringify(dirname)});};`

/**
 * A "register" function which hacks in a `require.context`function, mirroring
 * [webpacks version][0]
 *
 * Basically allows you to do `require.context('./types', true, /\.js$/)` to
 * import multiple files at the same time. While generally not advised (given
 * it's a webpack-only thing), people are already using it in the wild, so it
 * breaks when trying to deploy GraphQL APIs, or when running scripts using
 * `sanity exec`.
 *
 * This function works by intercepting Node.js's `require` via `addHook` from
 * [pirates](https://github.com/ariporad/pirates). This injects a small script
 * at the top of every file imported.
 *
 * The script itself is dynamically generated to include the current file's
 * dirname using the filename arg from `addHook` and an absolute path of
 * `@sanity/util/_internal` which imports the `createRequireContext` util.
 *
 * [0]: https://webpack.js.org/guides/dependency-management/#requirecontext
 */
export function register(): Revert {
  if (revert) return revert

  revert = addHook(
    (code, filename) => {
      // prevents circular imports of itself
      if (filename.includes('@sanity/util')) return code
      return `${augmentRequire(path.dirname(filename))}${code}`
    },
    {
      exts: ['.js', '.ts', '.tsx'],
      ignoreNodeModules: true,
    }
  )

  return revert
}
