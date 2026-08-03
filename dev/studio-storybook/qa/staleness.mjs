/**
 * staleness.mjs — the fourth gate, and the only one that checks a claim the catalog
 * cannot demonstrate.
 *
 * ## Why this exists
 *
 * The other three gates ask whether a story renders, behaves, and reads well. None of them
 * can ask whether it is still TRUE. `Navbar & Shell/Studio Logo` documented
 * `studio.components.logo` as a live customisation seam long after the seam was removed
 * upstream, and it passed the render gate the entire time, because `StudioLogo` in isolation
 * renders perfectly well.
 *
 *   A component that mounts is not a component that is mounted.
 *
 * Nothing in a component-level catalog detects that a component's CALLER went away. That is
 * structural, not an oversight, and it bites hardest on any docblock describing how a
 * component is *wired* rather than how it *behaves*.
 *
 * ## What it checks
 *
 * Every `packages/…` path that appears in a story file — in an import, a `**Source:**` line,
 * or anywhere in prose — must still exist on disk. A path that has moved or been deleted is
 * a page describing something that is no longer there.
 *
 * That is a weak check on purpose. It cannot tell you a docblock is wrong, only that a claim
 * it makes is now unanchored. But it is cheap, it has no false-positive mode, and it is
 * exactly the signal that would have caught finding #61 the day the seam was removed.
 *
 * ## What it deliberately does NOT do
 *
 * It does not verify that a cited symbol still exists in the file, nor that the file is still
 * reachable from a running studio. The first is doable and noisy; the second is the real
 * question and is not answerable statically. See `docs/knowledge/storybook-codex/
 * 11-customisation-seams.md` §5.
 *
 *   node qa/staleness.mjs            # report, exit 1 on any dangling citation
 *   node qa/staleness.mjs --list     # also print every citation checked
 */
import {execFileSync} from 'node:child_process'
import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs'
import {join, dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const STORYBOOK = resolve(HERE, '..')
const REPO = resolve(STORYBOOK, '../..')
const LIST = process.argv.includes('--list')

/** Every `.tsx`/`.ts` under a directory, recursively. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|mdx)$/.test(name)) out.push(full)
  }
  return out
}

/**
 * A citation is any `packages/…` path. Trailing punctuation and backticks are stripped; a
 * bare directory reference (no extension, no trailing slash) is resolved against the usual
 * suffixes before being called missing.
 */
const CITATION = /packages\/(?:@sanity\/)?[a-z0-9-]+\/(?:src|test)\/[A-Za-z0-9_./-]+/g

const SUFFIXES = ['', '.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx', '.mjs', '.js']

function resolves(citation) {
  const base = join(REPO, citation.replace(/[.,;:)`]+$/, ''))
  return SUFFIXES.some((s) => existsSync(base + s))
}

const files = [...walk(join(STORYBOOK, 'stories')), ...walk(join(STORYBOOK, 'lib'))]

let checked = 0
const dangling = new Map() // citation -> Set<file>

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const seen = new Set()
  for (const m of src.matchAll(CITATION)) {
    const cite = m[0].replace(/[.,;:)`]+$/, '')
    if (seen.has(cite)) continue
    seen.add(cite)
    checked += 1
    if (LIST) process.stdout.write(`  ${resolves(cite) ? 'ok  ' : 'GONE'} ${cite}\n`)
    if (!resolves(cite)) {
      const rel = file.slice(STORYBOOK.length + 1)
      if (!dangling.has(cite)) dangling.set(cite, new Set())
      dangling.get(cite).add(rel)
    }
  }
}

process.stdout.write(`\nstaleness gate: ${checked} citation(s) across ${files.length} file(s)\n`)

// ---------------------------------------------------------------------------------------
// PHASE 1b: the Stubbed lane's disclosure contract.
//
// A Stubbed story shows a real component filled with fabricated data, which makes it evidence
// about EXISTENCE and not about behaviour. Four lines keep that readable, and they are a fixed
// shape rather than prose precisely so this can check them:
//
//   **Real source:**   what it would really talk to
//   **Stubbed with:**  what it talks to here
//   **Mounted by:**    the file and condition that reaches this component in a real studio
//   **Cannot show:**   the claims this page is NOT evidence for
//
// `Mounted by` is the load-bearing one. `TelephoneInput` (ledger #64) renders perfectly, is
// publicly exported, and nothing mounts it; a stubbed page for it would look finished from
// every angle. The citation is the only thing that would have caught it, and phase 1 above
// already proves the cited path resolves.
//
// This is a HARD FAILURE, not a warning. The lane's whole justification is the disclosure; a
// stubbed page without it is the thing the lane was built to prevent.
// ---------------------------------------------------------------------------------------

const DISCLOSURE = ['Real source:', 'Stubbed with:', 'Mounted by:', 'Cannot show:']
const missingDisclosure = []

// Story files only. `lib/lanes.ts` and `.storybook/manager.tsx` contain the literal
// `variant:stubbed` because they IMPLEMENT the lane, and the legend in `Lanes.mdx` documents
// it; none of them is a page making a claim, and all three were flagged before this filter.
const isStoryFile = (f) => f.endsWith('.stories.tsx')
const stubbedPages = files
  .filter(isStoryFile)
  .filter((f) => /['"](?:variant|lane):stubbed['"]/.test(readFileSync(f, 'utf8')))

for (const file of stubbedPages) {
  const src = readFileSync(file, 'utf8')
  const absent = DISCLOSURE.filter((line) => !src.includes(`**${line}**`))
  if (absent.length) {
    missingDisclosure.push({file: file.slice(STORYBOOK.length + 1), absent})
  }
}

if (missingDisclosure.length) {
  process.stdout.write(`\n${missingDisclosure.length} stubbed page(s) MISSING the disclosure:\n\n`)
  for (const m of missingDisclosure) {
    process.stdout.write(`  ${m.file}\n      missing: ${m.absent.join(', ')}\n`)
  }
  process.stdout.write(
    '\nA stubbed story without its disclosure block is a fabricated screen presented as a real\n' +
      'one. Add the four lines to the meta docs description, verbatim, including `Mounted by:`\n' +
      'with a packages/ path that phase 1 can resolve.\n',
  )
  process.exitCode = 1
} else {
  process.stdout.write(
    `stubbed lane: ${stubbedPages.length} page(s), all four disclosure lines present\n`,
  )
}

// ---------------------------------------------------------------------------------------
// PHASE 2: the check that would actually have caught finding #61.
//
// Phase 1 only proves a cited file still EXISTS. `StudioLogo.tsx` existed throughout the
// period its seam was being removed; what went away was everything that called it. So for
// each component a story imports directly, ask whether anything in the source tree still
// references it, ignoring its own directory (a barrel re-export is not a consumer) and
// ignoring tests and stories (our own citation is not a consumer either).
//
// Zero references means the catalog is documenting a component the studio no longer mounts.
// This is a WARNING, not a failure: a component can be reached dynamically, by string, or
// through a re-export chain this does not follow. Treat each hit as a question to answer,
// not a verdict.
// ---------------------------------------------------------------------------------------

const storiedComponents = new Set()
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/from '(\.\.\/)+(packages\/[A-Za-z0-9_@./-]+)'/g)) {
    storiedComponents.add(m[2])
  }
}

/**
 * Search for the SYMBOLS a file exports, not its filename. `UnknownPaneType.tsx` exports
 * `UnknownPane`, which `StructureToolPane` renders; keying on the filename reported it as an
 * orphan when it is nothing of the sort. The file name is a convention, the export is the
 * contract.
 */
function exportedSymbols(path) {
  for (const ext of ['.tsx', '.ts']) {
    const full = join(REPO, path + ext)
    if (!existsSync(full)) continue
    const src = readFileSync(full, 'utf8')
    // PascalCase only. `export const MAX_DEPTH = 4` is a constant, not a component, and a
    // constant with no external reader is ordinary rather than a finding.
    const names = [...src.matchAll(/^export (?:function|const|class) ([A-Z][A-Za-z0-9_]*)/gm)]
      .map((m) => m[1])
      .filter((n) => /[a-z]/.test(n))
    if (names.length) return names
  }
  return []
}

const orphans = []
for (const path of storiedComponents) {
  const symbols = exportedSymbols(path)
  if (!symbols.length) continue // not a component module (types, helpers, fixtures)
  const name = symbols[0]
  // Only the file itself and its own directory's BARREL are excluded. A sibling component in
  // the same directory that imports this one is a genuine consumer; excluding the whole
  // directory tree hides real usage and floods the report with false positives.
  const ownDir = path.slice(0, path.lastIndexOf('/'))
  const selfAndBarrel = [`${path}.ts`, `${path}.tsx`, `${ownDir}/index.ts`, `${ownDir}/index.tsx`]
  let out = ''
  try {
    out = execFileSync(
      'grep',
      [
        '-rl',
        '--include=*.ts',
        '--include=*.tsx',
        '-e',
        symbols.map((sym) => `\\b${sym}\\b`).join('|'),
        '-E',
        join(REPO, 'packages'),
      ],
      {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
    )
  } catch {
    out = '' // grep exits 1 on no matches
  }
  const consumers = out
    .split('\n')
    .filter(Boolean)
    .map((f) => f.slice(REPO.length + 1))
    .filter((f) => !selfAndBarrel.includes(f))
    // Not consumers, and each one hid a real orphan when it was counted:
    //  - `packages/*/lib/**` is BUILD OUTPUT. A .d.ts naming a symbol proves it was exported,
    //    not that anything renders it.
    //  - `test-dts-exports` is a type-export smoke test that references every public export by
    //    construction, so it "consumes" everything and therefore distinguishes nothing.
    //  - tests, stories and workshop entries are our own citations, not the studio's.
    .filter((f) => !/(^|\/)lib\//.test(f))
    .filter((f) => !/test-dts-exports|\.test-d\.ts$/.test(f))
    .filter((f) => !/__tests__|\.test\.|\.stories\.|__workshop__/.test(f))
  if (consumers.length === 0) orphans.push({path, name})
}

if (orphans.length) {
  process.stdout.write(
    `\n${orphans.length} storied component(s) with NO consumer outside their own directory:\n\n`,
  )
  for (const o of orphans) process.stdout.write(`  ${o.name.padEnd(34)} ${o.path}\n`)
  process.stdout.write(
    '\nEach is a component the catalog documents and the studio may no longer mount.\n' +
      'This is the shape of finding #61. Verify each by hand: a barrel re-export is not a\n' +
      'consumer, and a component that only its own directory references is a candidate for\n' +
      'having been orphaned upstream.\n',
  )
} else {
  process.stdout.write('\nno storied component is obviously orphaned\n')
}

if (dangling.size === 0) {
  // NOT `process.exit(0)`: phase 1b sets `exitCode` on a missing disclosure block, and a hard
  // exit here would discard it and report a green gate over a real failure.
  process.stdout.write(
    process.exitCode
      ? '\nstaleness gate: FAIL — every cited path exists, but see the disclosure failures above\n'
      : '\nstaleness gate: PASS — every cited path still exists\n',
  )
  process.exit(process.exitCode ?? 0)
}

process.stdout.write(`\n${dangling.size} DANGLING citation(s):\n\n`)
for (const [cite, where] of dangling) {
  process.stdout.write(`  ${cite}\n`)
  for (const w of where) process.stdout.write(`      cited by ${w}\n`)
}
process.stdout.write(
  '\nA dangling citation means a page refers to something that has moved or been deleted.\n' +
    'Fix the page, do not fix the citation: the path is the evidence, and if it is gone the\n' +
    'claim built on it is the thing that needs re-checking.\n',
)
process.exit(1)
