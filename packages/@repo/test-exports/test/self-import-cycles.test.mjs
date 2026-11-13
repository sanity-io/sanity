import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {test} from 'node:test'

/**
 * The entries of `sanity` import each other through `sanity/...` self-references that the build
 * keeps external (`deps.neverBundle` in `packages/sanity/tsdown.config.ts`), so they resolve
 * through the exports map at runtime. `src/structure` and `src/presentation` import the public
 * API from `sanity` the same way. That is fine as long as no chunk in an entry's static import
 * closure imports that entry itself: such a cycle (`index.js -> shared chunk -> structure chunk
 * -> "sanity"`) evaluates in Node, where function declarations hoist, but not in vite's SSR
 * module runner, which the CLI uses for `sanity schema deploy`, `sanity schema extract` and the
 * manifest step of `sanity build`: the chunk's top-level calls into the entry
 * (`defineLocaleResourceBundle(...)`, `definePlugin(...)`) see a module that has not finished
 * evaluating and fail with `… is not a function`.
 *
 * The bundler creates such a chunk when a module is both imported dynamically and reached
 * statically from the entry: it emits a namespace object for the dynamic import, and the runtime
 * helper that builds it can be placed in a chunk with structure code. Import a module the entry
 * already reaches statically, rather than dynamically, and this stays green.
 */

const require = createRequire(import.meta.url)
const packageJsonPath = require.resolve('sanity/package.json')
const packageDir = path.dirname(packageJsonPath)
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const exportsMap = pkg.publishConfig?.exports ?? pkg.exports

const STATIC_IMPORT =
  /^import\s[^;]*?from\s*"(\.\/[^"]+)"|^import\s*"(\.\/[^"]+)"|^export\s[^;]*?from\s*"(\.\/[^"]+)"/gm

const sources = new Map()
function read(file) {
  if (!sources.has(file)) sources.set(file, readFileSync(path.join(packageDir, file), 'utf8'))
  return sources.get(file)
}

function staticImports(file) {
  const dir = path.posix.dirname(file)
  const out = new Set()
  for (const match of read(file).matchAll(STATIC_IMPORT)) {
    out.add(path.posix.normalize(path.posix.join(dir, match[1] ?? match[2] ?? match[3])))
  }
  return out
}

/** Every chunk reachable from `entryFile` through static imports, each with the chunk that led to it */
function staticClosure(entryFile) {
  const parent = new Map([[entryFile, null]])
  const queue = [entryFile]
  while (queue.length > 0) {
    const file = queue.shift()
    for (const dep of staticImports(file)) {
      if (!parent.has(dep)) {
        parent.set(dep, file)
        queue.push(dep)
      }
    }
  }
  return parent
}

function chainTo(parent, file) {
  const chain = []
  for (let current = file; current; current = parent.get(current)) chain.push(current)
  return chain.reverse().join(' -> ')
}

for (const [subpath, target] of Object.entries(exportsMap)) {
  const file = typeof target === 'string' ? target : (target.import ?? target.default)
  if (typeof file !== 'string' || !file.endsWith('.js')) continue
  const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`
  const selfImport = new RegExp(
    `^import\\s[^;]*?from\\s*"${specifier.replaceAll('/', '\\/')}";`,
    'm',
  )

  void test(`no chunk in the static import closure of ${specifier} imports "${specifier}"`, () => {
    const parent = staticClosure(path.posix.normalize(file))
    const offenders = [...parent.keys()].filter((chunk) => selfImport.test(read(chunk)))
    assert.deepEqual(
      offenders.map((chunk) => chainTo(parent, chunk)),
      [],
      `A chunk that "${specifier}" statically imports imports "${specifier}" back, a cycle the CLI's vite SSR worker cannot evaluate (see the comment at the top of this file)`,
    )
  })
}
