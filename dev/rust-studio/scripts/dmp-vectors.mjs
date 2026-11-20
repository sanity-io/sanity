// oxlint-disable no-console
// Writes reference vectors from `@sanity/diff-match-patch` (the library `@sanity/mutator` applies
// `diffMatchPatch` patches with) to `crates/sanity-mutator/tests/dmp-vectors.json`.
// `crates/sanity-mutator/tests/dmp_matches_js.rs` checks the Rust port against them: the
// stringified patch for a pair of texts, the result of applying it to a text that changed
// concurrently, and where an offset moves to across a diff. Seeded, so re-running it only changes
// the file when the library does.
import {writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const requireFromMutator = createRequire(join(root, '../../packages/@sanity/mutator/package.json'))
const dmp = await import(pathToFileURL(requireFromMutator.resolve('@sanity/diff-match-patch')).href)
const {applyPatches, makeDiff: diff, makePatches, parsePatch, stringifyPatches, xIndex} = dmp

let seed = 0x5eed
function random() {
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (items) => items[Math.floor(random() * items.length)]
const int = (max) => Math.floor(random() * max)

const ALPHABETS = [
  [...'abcdefghijklmnopqrstuvwxyz     '],
  [...'Hello world, the quick brown fox jumps over the lazy dog.\n'],
  ['a', 'b', ' ', '\n', '\n\n', '\r\n', '.', ','],
  ['😀', '👍🏽', '🇳🇴', 'é', 'ø', 'å', 'e\u0301', 'x', ' '],
  ['漢', '字', 'か', 'な', '。', ' ', 'ä'],
  ['%', '%20', '#', '?', '&', '=', '+', '/', ';', '@', ':', '$', ',', '~', "'", 'a', ' '],
  ['\u0001', '\u0002', '\t', 'x', 'y', '\u00a0', '\u2028'],
]

function text(alphabet, length) {
  let out = ''
  while (out.length < length) out += pick(alphabet)
  return out
}

function edit(base, alphabet, count) {
  let out = base
  for (let i = 0; i < count; i++) {
    const at = int(out.length + 1)
    const kind = int(3)
    // Never split a surrogate pair: neither side of an edit in the studio can produce one.
    const safe = (pos) =>
      pos > 0 && pos < out.length && /[\udc00-\udfff]/.test(out[pos]) ? pos - 1 : pos
    const start = safe(at)
    const end = safe(Math.min(out.length, start + int(6)))
    const insert = kind === 1 ? '' : text(alphabet, 1 + int(5))
    out = out.slice(0, start) + insert + (kind === 2 ? out.slice(start) : out.slice(end))
  }
  return out
}

// `encodeURI` throws on a lone surrogate, which a diff between two emoji can leave behind; the
// Studio then sets the whole value instead. `null` records that.
function stringifyOrNull(patches) {
  try {
    return stringifyPatches(patches)
  } catch {
    return null
  }
}

const cases = []
const unrelated = []

function addCase(alphabet, length, edits) {
  const base = text(alphabet, length)
  const mine = edit(base, alphabet, edits)
  const theirs = edit(base, alphabet, 1 + int(3))
  const patch = stringifyOrNull(makePatches(base, mine))
  const [result, applied] = patch
    ? applyPatches(parsePatch(patch), theirs, {allowExceedingIndices: true})
    : [null, null]
  const loc = int(base.length + 1)
  const mapped = xIndex(diff(base, theirs, {checkLines: false}), loc)
  cases.push({base, mine, theirs, patch, result, applied, loc, mapped})
}

for (let i = 0; i < 160; i++) addCase(pick(ALPHABETS), 1 + int(60), 1 + int(4))
for (let i = 0; i < 24; i++) addCase(pick(ALPHABETS), 100 + int(160), 1 + int(8))
for (let i = 0; i < 3; i++) addCase(ALPHABETS[1], 600 + int(600), 10 + int(10))

// Patches whose context no longer matches: a text the patch was not made against.
for (let i = 0; i < 30; i++) {
  const alphabet = pick(ALPHABETS)
  const base = text(alphabet, 20 + int(120))
  const patch = stringifyOrNull(makePatches(base, edit(base, alphabet, 1 + int(4))))
  if (!patch) continue
  const other = text(alphabet, int(140))
  const [result, applied] = applyPatches(parsePatch(patch), other, {allowExceedingIndices: true})
  unrelated.push({patch, text: other, result, applied})
}

const out = join(root, 'crates/sanity-mutator/tests/dmp-vectors.json')
writeFileSync(out, `${JSON.stringify({cases, unrelated})}\n`)
console.log(`Wrote ${cases.length} cases and ${unrelated.length} unrelated patches`)
