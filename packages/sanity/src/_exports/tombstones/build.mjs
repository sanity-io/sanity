/**
 * Builds the `sanity` package with type-only export tombstones applied to the
 * emitted `.d.ts` files, without feeding those `export declare` lines to
 * rolldown-plugin-dts.
 *
 * Large numbers of inline `export declare const …: never` in an entry barrel
 * can make the dts bundler emit a spurious `type` modifier on unrelated value
 * re-exports (observed on `SANITY_VERSION`). Monorepo consumers still resolve
 * the inline blocks in `src/_exports/*.ts`; the published `lib/*.d.ts` gets the
 * same declarations appended after tsdown finishes.
 *
 * Usage (from `packages/sanity`):
 *   node src/_exports/tombstones/build.mjs
 *   node src/_exports/tombstones/build.mjs --watch
 */
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'

import {BEGIN, END, listTombstoneTargets, PACKAGE_DIR as pkgDir} from './entries.mjs'

/**
 * @param {string} source
 * @returns {{stripped: string, block: string | null}}
 */
function extractTombstoneBlock(source) {
  const begin = source.indexOf(BEGIN)
  const end = source.indexOf(END)
  if (begin === -1 || end === -1 || end < begin) {
    return {stripped: source, block: null}
  }
  const block = source.slice(begin, end + END.length)
  const stripped = `${source.slice(0, begin)}${source.slice(end + END.length).replace(/^\n/, '')}`
  return {stripped, block}
}

/**
 * Drop generator header comments; keep the declare / type lines for lib append.
 * @param {string} block
 */
function blockBodyForDts(block) {
  return block
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('// <tombstones') &&
        !line.startsWith('// </tombstones') &&
        !line.startsWith('// Generated') &&
        !line.startsWith('// Type-only') &&
        !line.startsWith('// emit runtime'),
    )
    .join('\n')
    .trim()
}

const tsdownArgs = process.argv.slice(2)

if (tsdownArgs.includes('--watch')) {
  // Keep inline tombstones for monorepo HMR; strip/append is for one-shot builds only.
  const watchResult = spawnSync('pnpm', ['exec', 'tsdown', ...tsdownArgs], {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  })
  process.exit(watchResult.status ?? 1)
}

const targets = listTombstoneTargets()

/** @type {Map<string, {original: string, block: string | null}>} */
const saved = new Map()

for (const {source} of targets) {
  const path = source
  const original = readFileSync(path, 'utf8')
  const {stripped, block} = extractTombstoneBlock(original)
  saved.set(source, {original, block})
  if (block) writeFileSync(path, stripped)
}

let status = 1
try {
  const result = spawnSync('pnpm', ['exec', 'tsdown', ...tsdownArgs], {
    cwd: pkgDir,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  })
  status = result.status ?? 1
} finally {
  for (const [source, {original}] of saved) {
    writeFileSync(source, original)
  }
}

if (status !== 0) process.exit(status)

for (const {source, dts: dtsPath} of targets) {
  const {block} = saved.get(source) ?? {}
  if (!block) continue
  const body = blockBodyForDts(block)
  if (!body) continue
  const marker = '/* export tombstones (v7) */'
  const current = readFileSync(dtsPath, 'utf8').replace(/\s*$/, '')
  if (current.includes(marker)) continue
  writeFileSync(dtsPath, `${current}\n\n${marker}\n${body}\n`)
}
