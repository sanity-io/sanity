// oxlint-disable no-console
// Writes every color `buildTheme()` from `@sanity/ui` renders, flattened to dotted paths, to
// `target/js-theme-color.json`. `crates/sanity-ui/tests/theme_matches_js.rs` compares the Rust
// port of the theme against it.
import {mkdirSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const requireFromSanity = createRequire(join(root, '../../packages/sanity/package.json'))
const {buildTheme} = await import(pathToFileURL(requireFromSanity.resolve('@sanity/ui/theme')).href)

const flat = {}
function walk(prefix, value) {
  if (value === null || value === undefined) return
  if (typeof value !== 'object') {
    flat[prefix] = value
    return
  }
  // The theme defines its schemes and tones as lazy, non-enumerable getters.
  for (const key of Object.getOwnPropertyNames(value)) {
    walk(prefix ? `${prefix}.${key}` : key, value[key])
  }
}
walk('', buildTheme().v2.color)

const out = join(root, 'target/js-theme-color.json')
mkdirSync(dirname(out), {recursive: true})
writeFileSync(out, JSON.stringify(flat))
console.log(`Wrote ${Object.keys(flat).length} colors to ${out}`)
