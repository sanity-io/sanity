// `sanity` lists its side-effectful files in `sideEffects` instead of declaring `true`, so that
// bundlers drop the chunks a studio never uses. The build injects `import 'sanity/bundle.css'` into
// some entry barrels, and a barrel that is missing from the list is bypassed by bundlers together
// with that import, which ships a studio without its styles (see the comment in the package's
// `tsdown.config.ts`). The list is maintained by hand, and the build rewrites it from the files that
// import a stylesheet, so this checks whichever is in place against the built files.
import assert from 'node:assert/strict'
import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {test} from 'node:test'

const require = createRequire(import.meta.url)
const packageDir = path.dirname(require.resolve('sanity/package.json'))
const manifest = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
const libDir = path.join(packageDir, 'lib')

const CSS_IMPORT = /^import\s+["']sanity\/bundle\.css["'];?$/m
// A chunk can import a dependency's own stylesheet (the Portable Text table plugin's, for one)
const STYLESHEET_IMPORT = /^import\s+["'][^"']+\.css["'];?$/m

function barrelsImportingStylesheet() {
  return readdirSync(libDir)
    .filter((file) => file.endsWith('.js'))
    .filter((file) => CSS_IMPORT.test(readFileSync(path.join(libDir, file), 'utf8')))
    .map((file) => `./lib/${file}`)
}

void test('sanity lists its side-effectful files instead of declaring sideEffects: true', () => {
  assert.ok(Array.isArray(manifest.sideEffects), 'expected `sideEffects` to be an array')
})

void test('sanity lists every built barrel that imports sanity/bundle.css', () => {
  const barrels = barrelsImportingStylesheet()
  assert.ok(barrels.includes('./lib/index.js'), 'expected lib/index.js to import the stylesheet')
  assert.deepEqual(
    barrels.filter((barrel) => !manifest.sideEffects.includes(barrel)),
    [],
    'add these files to `sideEffects` in packages/sanity/package.json',
  )
})

void test('sanity lists only side-effectful files that exist', () => {
  for (const entry of manifest.sideEffects) {
    assert.ok(existsSync(path.join(packageDir, entry)), `${entry} does not exist`)
    if (entry.endsWith('.js')) {
      assert.ok(
        STYLESHEET_IMPORT.test(readFileSync(path.join(packageDir, entry), 'utf8')),
        `${entry} imports no stylesheet`,
      )
    }
  }
  assert.ok(manifest.sideEffects.includes('./lib/bundle.css'))
})
