/**
 * enumerate.mjs — the pass that produces the work-list, not a gate.
 *
 * ## Why this exists
 *
 * Every other script here asks a question about a story we already wrote. This one asks the
 * question no story can answer:
 *
 *   What is there?
 *
 * The catalog was built from what we happened to notice, and the coverage number quoted for it
 * (~36%) counted FILES. A file is not a unit of visibility. `ReleaseSummary.tsx` is one file
 * and renders an empty state, a loading skeleton, a populated table, a permission-blocked
 * variant and an upsell — five things a person could be shown, one tick in a file count.
 *
 * So this counts RENDERABLE STATES: the branches inside a component that decide what a person
 * actually sees. The gap between that list and the storied set is the honest coverage number.
 *
 * ## Structural vs local, and why the distinction carries the whole report
 *
 * A component contains two very different kinds of branch:
 *
 *   if (!release) return <NotFound />        // decides the WHOLE screen
 *   {icon && <Icon />}                       // decides whether an icon shows
 *
 * Both are conditionals. Only the first is the thing Faheem is afraid of missing: a screen that
 * appears in a scenario nobody happened to try. So each state is classified by where it sits:
 *
 *   structural — the branch is the component's own return value (JSX depth 0, function depth 0)
 *   local      — the branch is nested inside other JSX, or inside a render callback
 *
 * Structural is the headline. Local is kept because it is real, and because a component with 40
 * local branches and 1 story is worth knowing about, but it never drives the coverage number.
 *
 * ## Reachability tags
 *
 * Each state's guard is scanned for what would have to be true to reach it: permission, config,
 * async, empty, error. That is not decoration. It is the answer to "what do we have to stub",
 * which is exactly what the stubbed lane needs before it can be built.
 *
 * ## What it cannot do
 *
 * It cannot tell you WHICH state a story renders. A story declares no such thing. So coverage
 * here is component-level: states living in a component nothing imports are uncovered, states
 * in a storied component are *reachable* by the catalog, not necessarily reached by it. The
 * second number is a ceiling, and the report says so rather than rounding it into a claim.
 *
 *   node qa/enumerate.mjs                  # report + write qa/enumeration.json
 *   node qa/enumerate.mjs --top 40         # longest tail of uncovered components
 *   node qa/enumerate.mjs --component Foo  # every state in one component
 *   node qa/enumerate.mjs --area releases  # restrict to a source subtree
 */
import {readFileSync, readdirSync, statSync, writeFileSync, existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const STORYBOOK = resolve(HERE, '..')
const REPO = resolve(STORYBOOK, '../..')

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const TOP = Number(flag('top') ?? 25)
const ONLY_COMPONENT = flag('component')
const ONLY_AREA = flag('area')

// ---------------------------------------------------------------------------------------
// TypeScript is a transitive dependency here, not a declared one. Resolving it out of the
// pnpm store keeps this script from adding a devDependency (and therefore a lockfile change)
// to a package we are otherwise only reading. If it is ever declared properly, the first
// branch wins and this fallback becomes dead code.
// ---------------------------------------------------------------------------------------
const require_ = createRequire(import.meta.url)
function loadTypeScript() {
  try {
    return require_('typescript')
  } catch {
    /* fall through to the store */
  }
  const store = join(REPO, 'node_modules/.pnpm')
  const candidates = existsSync(store)
    ? readdirSync(store)
        .filter((d) => d.startsWith('typescript@'))
        .sort()
        .reverse()
    : []
  for (const c of candidates) {
    const path = join(store, c, 'node_modules/typescript')
    if (existsSync(path)) return require_(path)
  }
  process.stderr.write(
    'enumerate: could not resolve the typescript compiler.\n' +
      'It is a transitive dependency only. Run `pnpm install` at the repo root, or declare\n' +
      '`typescript` in dev/studio-storybook/package.json and re-run.\n',
  )
  process.exit(2)
}
const ts = loadTypeScript()

// ---------------------------------------------------------------------------------------
// Source roots
// ---------------------------------------------------------------------------------------

const SKIP = /(^|\/)(lib|node_modules|__tests__|__workshop__|__mocks__|__fixtures__)(\/|$)/
const SKIP_FILE = /\.(test|spec|stories|test-d)\.tsx?$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (SKIP.test(full)) continue
    if (statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.tsx') && !SKIP_FILE.test(name)) out.push(full)
  }
  return out
}

function sourceRoots() {
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
  return roots
}

// ---------------------------------------------------------------------------------------
// Reachability tags — what would have to be true (or stubbed) to see this state
// ---------------------------------------------------------------------------------------

const TAGS = [
  [
    'permission',
    /\b(permission|grant|canPublish|canCreate|canUpdate|canDelete|readOnly|currentUser|\brole\b|isAdmin|hasAccess|authenticat)/i,
  ],
  ['config', /\b(config|enabled|features?\b|plugin|beta|experimental|isDev|flag)/i],
  ['async', /\b(loading|isPending|isFetching|pending|\bready\b)/i],
  ['error', /\b(error|failed|invalid|isValid|hasError)/i],
  [
    'empty',
    /(\.length\s*(===?|<|>)|\blength\b\s*\?|^!\w|\bempty\b|\bno[A-Z]|undefined|=== null|\bnull\b)/,
  ],
]

function tagsFor(text) {
  return TAGS.filter(([, re]) => re.test(text)).map(([name]) => name)
}

const clean = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 110)

// ---------------------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------------------

/** Does this subtree contain JSX anywhere? Cheap test for "is this a component". */
function containsJsx(node) {
  let found = false
  const visit = (n) => {
    if (found) return
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      found = true
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/** Unwrap `memo(...)`, `forwardRef(...)`, `React.memo(forwardRef(...))` down to the function. */
function unwrapComponent(expr) {
  let node = expr
  for (let i = 0; i < 4; i++) {
    if (ts.isCallExpression(node) && node.arguments.length) {
      const callee = node.expression.getText()
      if (/\b(memo|forwardRef|observer|withRouter)$/.test(callee)) {
        node = node.arguments[0]
        continue
      }
    }
    if (ts.isParenthesizedExpression(node)) {
      node = node.expression
      continue
    }
    break
  }
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node : null
}

const isPascal = (n) => /^[A-Z][A-Za-z0-9_]*$/.test(n) && /[a-z]/.test(n)

/**
 * Collect the renderable states of one component body.
 *
 * `fnDepth` counts nested functions relative to the component. `jsxDepth` counts enclosing
 * JSX elements. A state is STRUCTURAL only at (0, 0): the branch is the component's own
 * return value, not something nested inside markup or deferred into a callback.
 */
function collectStates(fn, sf) {
  const states = []
  const stateUnions = []

  const push = (kind, node, guardNode, fnDepth, jsxDepth) => {
    const guard = guardNode ? clean(guardNode.getText(sf)) : ''
    states.push({
      kind,
      scope: fnDepth === 0 && jsxDepth === 0 ? 'structural' : 'local',
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      guard,
      tags: tagsFor(guard),
    })
  }

  const visit = (node, fnDepth, jsxDepth) => {
    // --- nested functions -------------------------------------------------------------
    // A render callback (`renderItem={(x) => ...}`) or an inner component gets its own
    // function depth, so nothing inside it can be mistaken for the parent's own return.
    if (
      node !== fn &&
      (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node))
    ) {
      ts.forEachChild(node, (c) => visit(c, fnDepth + 1, 0))
      return
    }

    // --- JSX nesting ------------------------------------------------------------------
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      ts.forEachChild(node, (c) => visit(c, fnDepth, jsxDepth + 1))
      return
    }

    // --- returns ----------------------------------------------------------------------
    if (ts.isReturnStatement(node)) {
      const expr = node.expression
      const rendersNothing =
        !expr ||
        expr.kind === ts.SyntaxKind.NullKeyword ||
        (ts.isIdentifier(expr) && expr.text === 'undefined')
      // Inside the component itself, EVERY return is a render outcome, including
      // `return content` where the JSX was assembled into a variable further up. Only
      // nested functions need the JSX test, because there a return may be an ordinary
      // helper result rather than something a person is shown.
      if (fnDepth === 0 || rendersNothing || containsJsx(node)) {
        // The guard is the nearest enclosing `if` condition, which is what a reader needs
        // in order to know how to reach this branch.
        let guardNode = null
        let p = node.parent
        for (let i = 0; i < 4 && p; i++, p = p.parent) {
          if (ts.isIfStatement(p)) {
            guardNode = p.expression
            break
          }
          if (ts.isCaseClause(p)) {
            guardNode = p.expression
            break
          }
          if (ts.isDefaultClause(p)) break
        }
        push(rendersNothing ? 'return-nothing' : 'return', node, guardNode, fnDepth, jsxDepth)
      }
      if (expr) ts.forEachChild(node, (c) => visit(c, fnDepth, jsxDepth))
      return
    }

    // --- ternaries --------------------------------------------------------------------
    if (ts.isConditionalExpression(node) && containsJsx(node)) {
      push('ternary', node, node.condition, fnDepth, jsxDepth)
    }

    // --- `cond && <X/>` ---------------------------------------------------------------
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
        node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) &&
      containsJsx(node.right)
    ) {
      push('guard', node, node.left, fnDepth, jsxDepth)
    }

    // --- switch over rendering --------------------------------------------------------
    if (ts.isSwitchStatement(node) && containsJsx(node)) {
      for (const clause of node.caseBlock.clauses) {
        if (!containsJsx(clause)) continue
        const label = ts.isCaseClause(clause)
          ? `${clean(node.expression.getText(sf))} === ${clean(clause.expression.getText(sf))}`
          : `${clean(node.expression.getText(sf))} (default)`
        states.push({
          kind: 'switch-case',
          scope: fnDepth === 0 && jsxDepth === 0 ? 'structural' : 'local',
          line: sf.getLineAndCharacterOfPosition(clause.getStart(sf)).line + 1,
          guard: label,
          tags: tagsFor(label),
        })
      }
    }

    // --- declared state unions --------------------------------------------------------
    // `useState<'idle' | 'loading' | 'error'>` is a component telling you, in the type
    // system, exactly how many modes it has. Cheaper and more reliable than inferring it.
    if (
      ts.isCallExpression(node) &&
      /^(useState|useReducer)$/.test(node.expression.getText(sf)) &&
      node.typeArguments?.length
    ) {
      const t = node.typeArguments[0]
      if (ts.isUnionTypeNode(t)) {
        const members = t.types
          .map((m) => m.getText(sf))
          .filter((m) => /^['"]/.test(m) || /^(null|undefined)$/.test(m))
        if (members.length > 1) {
          stateUnions.push({
            line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
            members,
          })
        }
      }
    }

    ts.forEachChild(node, (c) => visit(c, fnDepth, jsxDepth))
  }

  ts.forEachChild(fn, (c) => visit(c, 0, 0))

  // A concise arrow body (`const Chip = (props) => <Card .../>`) has no return statement at
  // all, so the walk above finds nothing and the component reports zero states. It renders
  // exactly one thing; say so, or every leaf component in the codebase vanishes from the count.
  if (fn.body && !ts.isBlock(fn.body)) {
    states.unshift({
      kind: 'return',
      scope: 'structural',
      line: sf.getLineAndCharacterOfPosition(fn.body.getStart(sf)).line + 1,
      guard: '',
      tags: [],
    })
  }

  return {states, stateUnions}
}

/** Every PascalCase function in a file that renders JSX. */
function componentsIn(sf) {
  const out = []
  const consider = (name, fn, exported) => {
    if (!name || !isPascal(name) || !fn) return
    if (!containsJsx(fn)) return
    out.push({name, fn, exported})
  }

  const isExported = (node) => !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

  const visitTop = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      consider(node.name.text, node, isExported(node))
    } else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer || !ts.isIdentifier(decl.name)) continue
        const fn = unwrapComponent(decl.initializer)
        consider(decl.name.text, fn, isExported(node))
      }
    }
    // Only top level and one level of block nesting; components declared inside other
    // components are covered by the parent's own state walk.
    if (ts.isModuleDeclaration(node) || ts.isModuleBlock(node)) ts.forEachChild(node, visitTop)
  }

  ts.forEachChild(sf, visitTop)
  return out
}

// ---------------------------------------------------------------------------------------
// What the catalog already imports
// ---------------------------------------------------------------------------------------

function storiedSymbols() {
  const names = new Set()
  const paths = new Set()
  const files = []
  /**
   * Third signal: components mounted THROUGH something rather than imported.
   *
   * A story that mounts a real parent and lets it dispatch to its children has storied those
   * children as surely as one importing each by hand, and rather better: it proves they compose.
   * An import scan cannot see any of it. `ChangesInspector.stories.tsx` covers five components
   * through the real `ChangesTabs` dispatcher and an import count credits one.
   *
   * The rule needs two pieces of evidence together, because either alone is too loose: the story
   * file must import from the component's own directory or the one above it (so the page is about
   * that neighbourhood), AND it must name the component as a whole word (so it is about that
   * component). Neither "imports from nearby" nor "mentions the name" would be enough.
   *
   * Reported separately from `names` so the two counts stay legible. A single merged number would
   * make today's totals jump for reasons unrelated to any new work.
   */
  const mounts = []
  const walkStories = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walkStories(full)
      else if (/\.(tsx?|mdx)$/.test(name)) files.push(full)
    }
  }
  for (const d of ['stories', 'lib']) {
    const full = join(STORYBOOK, d)
    if (existsSync(full)) walkStories(full)
  }
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(
      /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+'(?:\.\.\/)+(packages\/[A-Za-z0-9_@./-]+)'/g,
    )) {
      paths.add(m[2])
      for (const raw of m[1].split(',')) {
        const sym = raw
          .replace(/\s+as\s+.*/, '')
          .replace(/^\s*type\s+/, '')
          .trim()
        if (isPascal(sym)) names.add(sym)
      }
    }
    // Default and namespace imports from a packages path
    for (const m of src.matchAll(
      /import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+'(?:\.\.\/)+(packages\/[^']+)'/g,
    )) {
      names.add(m[1])
      paths.add(m[2])
    }
    // Barrel imports. A story reaching a component through `from 'sanity'` or
    // `from 'sanity/structure'` has storied it just as surely as one reaching through a
    // relative path; keying only on `packages/…` undercounts the catalog against itself.
    for (const m of src.matchAll(
      /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+'(?:sanity(?:\/[a-z_-]+)?|@sanity\/[a-z-]+(?:\/[a-z-]+)?)'/g,
    )) {
      for (const raw of m[1].split(',')) {
        const sym = raw
          .replace(/\s+as\s+.*/, '')
          .replace(/^\s*type\s+/, '')
          .trim()
        if (isPascal(sym)) names.add(sym)
      }
    }
  }
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    const dirs = new Set()
    for (const m of src.matchAll(/from '(?:\.\.\/)+(packages\/[^']+)'/g)) {
      const d = m[1].slice(0, m[1].lastIndexOf('/'))
      dirs.add(d)
      dirs.add(d.slice(0, d.lastIndexOf('/')))
    }
    if (dirs.size) mounts.push({dirs, src})
  }

  /** Is `name` (declared in `rel`) mounted through a parent by some story file? */
  const mountedThrough = (name, rel) => {
    const dir = rel.slice(0, rel.lastIndexOf('/'))
    const word = new RegExp(`\\b${name}\\b`)
    return mounts.some((m) => m.dirs.has(dir) && word.test(m.src))
  }

  return {names, paths, mountedThrough}
}

// ---------------------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------------------

const roots = sourceRoots()
const files = roots.flatMap((r) => walk(r))
const storied = storiedSymbols()

const components = []
let parsed = 0

for (const file of files) {
  const rel = file.slice(REPO.length + 1)
  if (ONLY_AREA && !rel.includes(ONLY_AREA)) continue
  const src = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  parsed += 1
  for (const {name, fn, exported} of componentsIn(sf)) {
    if (ONLY_COMPONENT && name !== ONLY_COMPONENT) continue
    const {states, stateUnions} = collectStates(fn, sf)
    const structural = states.filter((s) => s.scope === 'structural')
    components.push({
      name,
      file: rel,
      exported,
      storied: storied.names.has(name) || storied.mountedThrough(name, rel),
      /** Storied only because a story mounts it through a real parent. See storiedSymbols. */
      storiedByMount: !storied.names.has(name) && storied.mountedThrough(name, rel),
      states: states.length,
      structural: structural.length,
      local: states.length - structural.length,
      unions: stateUnions,
      detail: states,
    })
  }
}

// ---------------------------------------------------------------------------------------
// Post-pass: a module-local component is covered when its own file's exported one is storied
// ---------------------------------------------------------------------------------------
//
// Two reporting corrections, neither of which changes what has been written. Both made the work
// list larger than the work.
//
// 1. A component that is not exported can only be rendered by something in its own file. So if an
//    exported component in that file is storied, the module-local ones it renders are exercised by
//    that story. `DocumentPaneInner` is covered the moment `DocumentPane` has a page. The earlier
//    `mountedThrough` rule missed these because it requires the story to NAME the component, and a
//    story mounting `DocumentPane` has no reason to mention its inner half.
//
// 2. `export const X = memo(XComponent)` leaves `XComponent` unexported, so it is counted as a
//    second component. It is the same one twice. This codebase uses the `*Component` suffix
//    consistently for the pattern, and only ever inside the file that exports the memo.
//
// Both are recorded on their own flags rather than folded silently into `storied`, so the two
// counts stay legible and either can be argued with.

const exportedStoriedByFile = new Set(
  components.filter((c) => c.exported && c.storied).map((c) => c.file),
)
const exportedNamesByFile = new Map()
for (const c of components.filter((c) => c.exported)) {
  if (!exportedNamesByFile.has(c.file)) exportedNamesByFile.set(c.file, new Set())
  exportedNamesByFile.get(c.file).add(c.name)
}

for (const c of components) {
  if (c.exported || c.storied) continue
  const isMemoInner =
    c.name.endsWith('Component') &&
    exportedNamesByFile.get(c.file)?.has(c.name.replace(/Component$/, ''))
  if (isMemoInner) {
    c.memoInner = true
    c.storied = components.some((x) => x.file === c.file && x.exported && x.storied)
    continue
  }
  if (exportedStoriedByFile.has(c.file)) {
    c.storied = true
    c.storiedByParentInFile = true
  }
}

// ---------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------

const out = (s) => process.stdout.write(s)

if (ONLY_COMPONENT) {
  for (const c of components) {
    out(`\n${c.name}  ${c.file}\n`)
    out(
      `  ${c.structural} structural · ${c.local} local · storied: ${c.storied ? 'yes' : 'NO'}\n\n`,
    )
    for (const s of c.detail) {
      const tag = s.tags.length ? `  [${s.tags.join(' ')}]` : ''
      out(
        `  ${String(s.line).padStart(5)}  ${s.scope.padEnd(10)} ${s.kind.padEnd(14)} ${s.guard}${tag}\n`,
      )
    }
    for (const u of c.unions) {
      out(`  ${String(u.line).padStart(5)}  union      ${u.members.join(' | ')}\n`)
    }
  }
  process.exit(0)
}

const total = (arr, k) => arr.reduce((n, c) => n + c[k], 0)
const storiedComps = components.filter((c) => c.storied)
const unstoried = components.filter((c) => !c.storied)

const totalStructural = total(components, 'structural')
const coveredStructural = total(storiedComps, 'structural')
const unionCount = components.reduce((n, c) => n + c.unions.length, 0)

out(`\nenumeration\n${'='.repeat(78)}\n\n`)
out(`  ${parsed} file(s) parsed across ${roots.length} package source root(s)\n`)
out(`  ${components.length} component(s) that render JSX\n\n`)

out(`  renderable states\n`)
out(`    structural (decide the whole render)   ${String(totalStructural).padStart(6)}\n`)
out(
  `    local      (nested inside other JSX)   ${String(total(components, 'local')).padStart(6)}\n`,
)
out(`    declared state unions                  ${String(unionCount).padStart(6)}\n`)

out(`\n  component coverage\n`)
out(
  `    storied     ${String(storiedComps.length).padStart(5)}  (${((storiedComps.length / components.length) * 100).toFixed(1)}%)\n`,
)
out(`    unstoried   ${String(unstoried.length).padStart(5)}\n`)

out(`\n  STRUCTURAL STATE COVERAGE (the honest number)\n`)
out(
  `    reachable by the catalog   ${String(coveredStructural).padStart(6)}  (${((coveredStructural / totalStructural) * 100).toFixed(1)}%)\n`,
)
out(
  `    in components nothing imports ${String(totalStructural - coveredStructural).padStart(3)}\n`,
)
out(
  `\n  "reachable" is a CEILING, not a claim. A story renders one state; nothing here knows\n` +
    `  which. ${coveredStructural} is the most that could be covered, not the amount that is.\n`,
)
out(`  (${unionCount} declared state unions found; each is a component naming its own modes)\n`)

// Which tags dominate the uncovered work — this is the stub shopping list.
const tagCounts = {}
for (const c of unstoried) {
  for (const s of c.detail) {
    if (s.scope !== 'structural') continue
    for (const t of s.tags) tagCounts[t] = (tagCounts[t] || 0) + 1
  }
}
out(`\n  what the uncovered structural states are gated on\n`)
for (const [t, n] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
  out(`    ${t.padEnd(12)} ${String(n).padStart(5)}\n`)
}

// ---------------------------------------------------------------------------------------
// Area rollup. The aggregate says how much is missing; this says WHERE, which is the only
// form the number can be acted on. An area is the subsystem a path belongs to, one level
// below `src/` and two for `core/`, because `core` alone spans forms, releases and studio
// chrome and is useless as a bucket.
// ---------------------------------------------------------------------------------------

function areaOf(file) {
  const m = file.match(/^packages\/(?:@sanity\/([a-z-]+)|([a-z-]+))\/src\/(.*)$/)
  if (!m) return 'other'
  const pkg = m[1] ? `@sanity/${m[1]}` : m[2]
  const rest = m[3].split('/')
  if (pkg !== 'sanity') return pkg
  return rest[0] === 'core' && rest.length > 1 ? `core/${rest[1]}` : rest[0]
}

const areas = new Map()
for (const c of components) {
  const a = areaOf(c.file)
  if (!areas.has(a)) areas.set(a, {area: a, comps: 0, storiedComps: 0, structural: 0, covered: 0})
  const row = areas.get(a)
  row.comps += 1
  row.structural += c.structural
  if (c.storied) {
    row.storiedComps += 1
    row.covered += c.structural
  }
}

out(`\n\n  by area — structural states, and the ceiling the catalog can reach\n`)
out(`  ${'-'.repeat(74)}\n`)
out(
  `  ${'area'.padEnd(28)}${'comps'.padStart(7)}${'states'.padStart(8)}${'reach'.padStart(7)}${'gap'.padStart(7)}\n`,
)
for (const r of [...areas.values()].sort(
  (a, b) => b.structural - b.covered - (a.structural - a.covered),
)) {
  if (r.structural < 8) continue
  const gap = r.structural - r.covered
  out(
    `  ${r.area.padEnd(28)}${String(r.comps).padStart(7)}${String(r.structural).padStart(8)}` +
      `${String(r.covered).padStart(7)}${String(gap).padStart(7)}\n`,
  )
}

out(`\n\n  top ${TOP} unstoried components by structural state count\n`)
out(`  ${'-'.repeat(74)}\n`)
for (const c of unstoried
  .slice()
  .sort((a, b) => b.structural - a.structural)
  .slice(0, TOP)) {
  out(
    `  ${String(c.structural).padStart(3)}  ${c.name.padEnd(34)} ${c.file.replace('packages/', '')}\n`,
  )
}

out(`\n\n  top ${TOP} STORIED components by structural state count\n`)
out(`  (a story exists; whether it shows all of these is the question the catalog owes)\n`)
out(`  ${'-'.repeat(74)}\n`)
for (const c of storiedComps
  .slice()
  .sort((a, b) => b.structural - a.structural)
  .slice(0, TOP)) {
  out(
    `  ${String(c.structural).padStart(3)}  ${c.name.padEnd(34)} ${c.file.replace('packages/', '')}\n`,
  )
}

// The per-state `detail` is a megabyte of derived data that regenerates in under two seconds
// and changes every time upstream does. Committing it would be churn, so the artifact carries
// the work-list and the counts; `--full` writes the fat version for interactive digging, and
// `--component X` reprints one component's states on demand.
const FULL = argv.includes('--full')

const payload = {
  generated: 'run `node qa/enumerate.mjs` to refresh',
  totals: {
    files: parsed,
    components: components.length,
    structural: totalStructural,
    local: total(components, 'local'),
    unions: unionCount,
    storiedComponents: storiedComps.length,
    structuralReachable: coveredStructural,
  },
  areas: [...areas.values()].sort((a, b) => b.structural - a.structural),
  components: components
    .sort((a, b) => b.structural - a.structural)
    .map(({detail, ...rest}) => ({
      ...rest,
      // Which gates stand between a person and this component's structural states. This is
      // the stub shopping list, per component, and it is the field the lane work reads.
      gates: [...new Set(detail.filter((s) => s.scope === 'structural').flatMap((s) => s.tags))],
      ...(FULL ? {detail} : {}),
    })),
}
const artifact = join(HERE, FULL ? 'enumeration.full.json' : 'enumeration.json')
writeFileSync(artifact, `${JSON.stringify(payload, null, 2)}\n`)
out(`\n\n  wrote qa/${artifact.slice(HERE.length + 1)}\n\n`)
