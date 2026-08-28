/**
 * Stamp a built dist with the flags it was built under, so the runner can
 * tell dist flavors apart (`bench-build-flags.json`). The pristine build
 * writes no marker — absence means "no customizations", which also covers
 * every historical dist.
 *
 * Usage: node scripts/write-build-flags.mjs <dist-dir> <flag> [<flag> ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const [dir, ...flags] = process.argv.slice(2)
if (!dir || flags.length === 0) {
  console.error('usage: write-build-flags.mjs <dist-dir> <flag> [<flag> ...]')
  process.exit(1)
}
fs.writeFileSync(
  path.join(dir, 'bench-build-flags.json'),
  `${JSON.stringify(Object.fromEntries(flags.map((flag) => [flag, true])), null, 2)}\n`,
)
