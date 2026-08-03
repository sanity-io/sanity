/**
 * shape.mjs — what KIND of thing is each component, and does the coverage number mean what
 * it sounds like it means?
 *
 * ## The question this exists to answer
 *
 * `enumerate.mjs` says the catalog reaches at most 17.9% of the studio's renderable states.
 * Faheem's objection to that number is good: the surfaces we HAVE covered look like the
 * primary ones, so either the number is misleading about what matters, or the studio has an
 * enormous tail of things nobody thinks of as screens.
 *
 * Both can be true, and a single percentage cannot tell them apart. So this classifies every
 * component two ways and reports coverage per bucket instead of once overall.
 *
 * ## Axis 1 — composition layer (the atomic-design question)
 *
 * Derived from the import graph, not from names, because names lie and the graph does not:
 *
 *   fan-out — how many OTHER components in this codebase it renders
 *   fan-in  — how many other files import it
 *
 * A thing that renders nothing and is rendered everywhere is an atom. A thing that renders
 * twenty others and is rendered once is a page. That is the whole of atomic design, and it
 * falls out of two numbers:
 *
 *   atom      fan-out 0        a leaf: composes only @sanity/ui and markup
 *   molecule  fan-out 1-3      a small cluster of leaves
 *   organism  fan-out 4-9      a substantial region
 *   template  fan-out 10+      a whole arrangement
 *
 * with one override: anything that is a route, tool, pane or *Screen is a PAGE regardless of
 * fan-out, because what makes it a page is that it owns the viewport, not how much it renders.
 *
 * ## Axis 2 — interaction role (what a person does with it)
 *
 * The atomic layer says how big a thing is. It does not say whether a person can SEE it, which
 * is the axis that decides whether it belongs in a catalog at all. A provider renders nothing;
 * an input is the whole point.
 *
 *   screen        owns the viewport
 *   overlay       a dialog, popover, menu, tooltip: appears over the app
 *   input         a field or control a person edits
 *   navigation    moves you somewhere
 *   feedback      tells you what happened: banners, errors, empty and loading states
 *   display       shows content without accepting edits: previews, rows, avatars
 *   container     layout and structure with no content of its own
 *   invisible     a provider, boundary or hook-holder: renders no UI of its own
 *
 * `invisible` matters more than it sounds. `ActiveWorkspaceMatcher` reports eight renderable
 * states and is a PROVIDER: those states are the error and loading screens it falls back to,
 * not eight appearances of a component. Counting it beside a button flattens a real difference.
 *
 * ## What this is not
 *
 * Heuristics, all of them, and they will be wrong at the margins. The point is not a perfect
 * taxonomy; it is to stop one number from standing in for eight different situations.
 *
 *   node qa/shape.mjs                 # report + qa/shape.json
 *   node qa/shape.mjs --bucket input  # list one interaction role
 *   node qa/shape.mjs --layer atom    # list one composition layer
 */
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const STORYBOOK = resolve(HERE, '..')
const REPO = resolve(STORYBOOK, '../..')

const argv = process.argv.slice(2)
const flag = (n) => {
  const i = argv.indexOf(`--${n}`)
  return i === -1 ? null : argv[i + 1]
}
const ONLY_BUCKET = flag('bucket')
const ONLY_LAYER = flag('layer')

// The enumeration is the input: it already knows every component, its states and whether the
// catalog imports it. Re-deriving that here would be a second source of truth.
const ENUM = join(HERE, 'enumeration.json')
if (!existsSync(ENUM)) {
  process.stderr.write('shape: run `node qa/enumerate.mjs` first — this reads its output.\n')
  process.exit(2)
}
const enumeration = JSON.parse(readFileSync(ENUM, 'utf8'))

// ---------------------------------------------------------------------------------------
// The import graph
// ---------------------------------------------------------------------------------------

const SKIP = /(^|\/)(lib|node_modules|__tests__|__workshop__|__mocks__|__fixtures__)(\/|$)/
const SKIP_FILE = /\.(test|spec|stories|test-d)\.tsx?$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (SKIP.test(full)) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(name) && !SKIP_FILE.test(name)) out.push(full)
  }
  return out
}

const roots = []
const pkgs = join(REPO, 'packages')
for (const name of readdirSync(pkgs)) {
  if (name === '@sanity') {
    for (const scoped of readdirSync(join(pkgs, name))) {
      const src = join(pkgs, name, scoped, 'src')
      if (existsSync(src)) roots.push(src)
    }
  } else {
    const src = join(pkgs, name, 'src')
    if (existsSync(src)) roots.push(src)
  }
}
const allFiles = roots.flatMap((r) => walk(r))

/** Every component name known to the enumeration, so the graph only counts OUR components. */
const known = new Set(enumeration.components.map((c) => c.name))

/** name -> how many distinct files import it */
const fanIn = new Map()
/** file -> Set of component names it imports */
const importsByFile = new Map()

const IMPORT = /import\s+(?:type\s+)?(?:\{([^}]*)\}|([A-Za-z_$][\w$]*))\s+from\s+'([^']+)'/g

for (const file of allFiles) {
  const src = readFileSync(file, 'utf8')
  const names = new Set()
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[3]
    // Only LOCAL imports. A component imported from '@sanity/ui' is not one of ours, and
    // counting it would make every Card in the codebase look like a shared atom.
    if (!spec.startsWith('.')) continue
    const bindings = m[1]
      ? m[1].split(',').map((s) =>
          s
            .replace(/\s+as\s+.*/, '')
            .replace(/^\s*type\s+/, '')
            .trim(),
        )
      : [m[2]]
    for (const b of bindings) {
      if (b && known.has(b)) names.add(b)
    }
  }
  importsByFile.set(file.slice(REPO.length + 1), names)
  for (const n of names) fanIn.set(n, (fanIn.get(n) ?? 0) + 1)
}

// ---------------------------------------------------------------------------------------
// Axis 2 — interaction role
// ---------------------------------------------------------------------------------------

/**
 * Ordered: the first match wins, most-specific first. `DocumentPaneInner` is a screen before
 * it is a container; `CommentsProvider` is invisible before it is anything else.
 */
const ROLES = [
  [
    'invisible',
    /(Provider|Boundary|Matcher|Context|Scope|Tracker|Listener|Observer|Handler|Manager|Store)$/,
  ],
  // Plugin seam wrappers. `TasksStudioActiveToolLayout` and `CommentsStudioLayout` are how a
  // plugin injects itself around the studio; they render `renderDefault` and almost nothing
  // else, so they are plumbing however screen-sized their name looks.
  ['invisible', /(StudioLayout|ActiveToolLayout|DocumentLayout|LayoutProvider)$/],
  // Deliberately NARROW. An earlier version matched `Layout|Shell|Root|App` too and swept in
  // `RowLayout`, `CellLayout`, `TableLayout` and a styled-component called `Root` — none of
  // which owns a viewport. A screen is a Screen, a Tool or a Pane, or it lives in screens/.
  ['screen', /(Screen|Tool|Pane)$/],
  ['overlay', /(Dialog|Modal|Popover|Tooltip|Menu|MenuItem|MenuButton|Sheet|Drawer|Portal)$/],
  [
    'input',
    /(Input|Field|Picker|Select|Editor|Form|Upload|Search|Filter|Textarea|Checkbox|Toggle)$/,
  ],
  ['navigation', /(Link|Nav|Navbar|Breadcrumb|Tab|Tabs|Router|Route|Anchor|Back|Home)$/],
  [
    'feedback',
    /(Banner|Toast|Alert|Error|Empty|Loading|Skeleton|Progress|Spinner|Status|Badge|Warning|Notice|Callout)$/,
  ],
  ['navigation', /^(Go|Open|Close|Show|Hide)/],
  [
    'display',
    /(Preview|Item|List|Row|Cell|Table|Avatar|Icon|Card|Text|Title|Label|Description|Summary|Detail|View|Chip|Tag|Thumbnail|Image|Video|Diff|Change)$/,
  ],
  [
    'container',
    /(Container|Wrapper|Group|Stack|Grid|Flex|Box|Section|Header|Footer|Sidebar|Panel|Region|Frame|Layout|Shell|Root)$/,
  ],
  ['navigation', /(Button)$/], // after feedback/overlay so StatusButton and MenuButton land right
]

function roleOf(name, file) {
  if (/\/screens\//.test(file) || /\/tool\//.test(file)) {
    if (/(Screen|Tool)$/.test(name)) return 'screen'
  }
  for (const [role, re] of ROLES) if (re.test(name)) return role
  return 'display' // the honest default: something that puts content on screen
}

// ---------------------------------------------------------------------------------------
// Axis 1 — composition layer
// ---------------------------------------------------------------------------------------

const PAGEISH = /(Screen|Tool|Pane)$/

function layerOf(name, file, fanOut) {
  if (PAGEISH.test(name) || /\/screens\//.test(file)) return 'page'
  if (fanOut === 0) return 'atom'
  if (fanOut <= 3) return 'molecule'
  if (fanOut <= 9) return 'organism'
  return 'template'
}

// ---------------------------------------------------------------------------------------
// Enrich
// ---------------------------------------------------------------------------------------

const enriched = enumeration.components.map((c) => {
  const imports = importsByFile.get(c.file) ?? new Set()
  // A component's own file may declare several components; fan-out is per FILE, which is the
  // honest granularity available without resolving which JSX each function actually renders.
  const fanOut = imports.size
  const role = roleOf(c.name, c.file)
  const layer = role === 'invisible' ? 'invisible' : layerOf(c.name, c.file, fanOut)
  return {
    ...c,
    fanIn: fanIn.get(c.name) ?? 0,
    fanOut,
    role,
    layer,
    // Can a person point at this on screen? The catalog's job is these; the rest is plumbing
    // that exists so these can work.
    visible: role !== 'invisible' && role !== 'container',
  }
})

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------

const out = (s) => process.stdout.write(s)

if (ONLY_BUCKET || ONLY_LAYER) {
  const rows = enriched
    .filter((c) => (ONLY_BUCKET ? c.role === ONLY_BUCKET : true))
    .filter((c) => (ONLY_LAYER ? c.layer === ONLY_LAYER : true))
    .sort((a, b) => b.fanIn - a.fanIn)
  out(`\n${rows.length} component(s)\n\n`)
  out(
    `  ${'in'.padStart(4)}${'out'.padStart(5)}${'st'.padStart(4)}  ${'story'.padEnd(6)}${'name'.padEnd(32)}file\n`,
  )
  for (const c of rows.slice(0, 120)) {
    out(
      `  ${String(c.fanIn).padStart(4)}${String(c.fanOut).padStart(5)}${String(c.structural).padStart(4)}  ` +
        `${(c.storied ? 'yes' : '-').padEnd(6)}${c.name.slice(0, 31).padEnd(32)}${c.file.replace('packages/sanity/src/', '').replace('packages/', '')}\n`,
    )
  }
  process.exit(0)
}

function table(title, keyFn, order) {
  const rows = new Map()
  for (const c of enriched) {
    const k = keyFn(c)
    if (!rows.has(k)) rows.set(k, {k, comps: 0, storied: 0, states: 0, covered: 0})
    const r = rows.get(k)
    r.comps += 1
    r.states += c.structural
    if (c.storied) {
      r.storied += 1
      r.covered += c.structural
    }
  }
  out(`\n  ${title}\n  ${'-'.repeat(72)}\n`)
  out(
    `  ${'bucket'.padEnd(14)}${'comps'.padStart(7)}${'storied'.padStart(9)}${'%'.padStart(7)}${'states'.padStart(8)}${'reach'.padStart(7)}\n`,
  )
  const keys = order ?? [...rows.keys()].sort((a, b) => a.localeCompare(b))
  for (const k of keys) {
    const r = rows.get(k)
    if (!r) continue
    const pct = ((r.storied / r.comps) * 100).toFixed(0)
    out(
      `  ${String(k).padEnd(14)}${String(r.comps).padStart(7)}${String(r.storied).padStart(9)}` +
        `${`${pct}%`.padStart(7)}${String(r.states).padStart(8)}${String(r.covered).padStart(7)}\n`,
    )
  }
  return rows
}

out(`\nshape of the component catalog\n${'='.repeat(74)}\n`)
out(
  `\n  ${enriched.length} components, ${enriched.reduce((n, c) => n + c.structural, 0)} structural states\n`,
)

table('by interaction role — what a person does with it', (c) => c.role, [
  'screen',
  'overlay',
  'input',
  'navigation',
  'feedback',
  'display',
  'container',
  'invisible',
])

table('by composition layer — atomic design, derived from the import graph', (c) => c.layer, [
  'page',
  'template',
  'organism',
  'molecule',
  'atom',
  'invisible',
])

// THE headline test: is coverage concentrated on what a person can see?
const vis = enriched.filter((c) => c.visible)
const invis = enriched.filter((c) => !c.visible)
const sum = (a, k) => a.reduce((n, c) => n + c[k], 0)
out(`\n\n  the question the single percentage was hiding\n  ${'-'.repeat(72)}\n`)
out(
  `  things a person can point at    ${String(vis.length).padStart(5)} comps  ` +
    `${String(sum(vis, 'structural')).padStart(5)} states  ` +
    `${((vis.filter((c) => c.storied).length / vis.length) * 100).toFixed(1)}% storied\n`,
)
out(
  `  plumbing (containers/providers) ${String(invis.length).padStart(5)} comps  ` +
    `${String(sum(invis, 'structural')).padStart(5)} states  ` +
    `${((invis.filter((c) => c.storied).length / invis.length) * 100).toFixed(1)}% storied\n`,
)

// Shared vs local. A component nothing else imports is a leaf of one screen; one imported
// fifteen times is load-bearing across the product, and the second is worth far more per story.
const shared = enriched.filter((c) => c.fanIn >= 5)
const oneOff = enriched.filter((c) => c.fanIn <= 1)
out(
  `\n  reused in 5+ places             ${String(shared.length).padStart(5)} comps  ` +
    `${String(sum(shared, 'structural')).padStart(5)} states  ` +
    `${((shared.filter((c) => c.storied).length / shared.length) * 100).toFixed(1)}% storied\n`,
)
out(
  `  used in 0-1 places (leaves)     ${String(oneOff.length).padStart(5)} comps  ` +
    `${String(sum(oneOff, 'structural')).padStart(5)} states  ` +
    `${((oneOff.filter((c) => c.storied).length / oneOff.length) * 100).toFixed(1)}% storied\n`,
)

writeFileSync(
  join(HERE, 'shape.json'),
  `${JSON.stringify({generated: 'node qa/shape.mjs', components: enriched}, null, 2)}\n`,
)
out(`\n  wrote qa/shape.json\n\n`)
