// oxlint-disable no-console
// Downloads the raw SVGs of `@sanity/icons` from sanity-io/icons into crates/sanity-icons/svg.
// `node scripts/vendor-icons.mjs` refreshes the vendored icons at REF; pass icon names
// (`node scripts/vendor-icons.mjs chevron-down trash`) to add more.
import {readdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

// @sanity/icons@5.3.0
const REF = 'bf6956205d19a12038ecd41936724bf874fbca8c'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../crates/sanity-icons/svg')
const vendored = readdirSync(dir)
  .filter((file) => file.endsWith('.svg'))
  .map((file) => file.slice(0, -'.svg'.length))
const names = [...new Set([...vendored, ...process.argv.slice(2)])].toSorted((a, b) =>
  a.localeCompare(b),
)

await Promise.all(
  names.map(async (name) => {
    const url = `https://raw.githubusercontent.com/sanity-io/icons/${REF}/packages/icons/export/${name}.svg`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    writeFileSync(join(dir, `${name}.svg`), await response.text())
  }),
)
console.log(`Vendored ${names.length} icons from sanity-io/icons@${REF.slice(0, 7)}`)
