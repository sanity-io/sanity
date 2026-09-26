/**
 * Code in this repository must not import `@internal` symbols from the public `sanity`,
 * `sanity/structure` and `sanity/router` entries. Inside `packages/sanity` they are imported
 * relatively from the module that declares them; everywhere else (`@sanity/vision`, the dev,
 * example and perf studios, the e2e suite, the test harnesses) they are imported from
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 *
 * The public entries still export those symbols today, so nothing enforces this at build time:
 * this test does, so that the repo's own consumers are already off the public entries when the
 * public entries drop their internals in a future major, and so that the boundary stays visible
 * to plugin authors reading the source. A name counts when the built `.d.ts` of the public entry
 * tags it `@internal` (same classification as `internals-entry-completeness.test.ts`) *and* the
 * internals entry exports it: the deliberate exceptions that stay off the entry (deprecated
 * utilities such as `createAuthStore`, see `PUBLIC_BY_USAGE` in that test) have no other import
 * path and are imported from `sanity`.
 *
 * Covered forms: named imports; namespace imports (`import * as S from 'sanity'` followed by
 * `S.name` in value or type position); dynamic imports of an entry, directly or through a
 * module-scope `const load = () => import('sanity')` alias, when the module is destructured
 * (`const {name} = await load()`), accessed (`(await import('sanity')).name`) or handed to
 * `.then((m) => m.name)` / `.then(({name}) => …)`. Other ways of reaching the module object are
 * not analysed, so do not introduce them for these entries.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type ExportedDeclarations, Node, Project} from 'ts-morph'
import ts from 'typescript'
import {afterAll, beforeAll, describe, expect, test} from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../../..')
const sanityLibDir = path.join(repoRoot, 'packages/sanity/lib')

const INTERNALS_ENTRY_DTS = '_dangerously_use_private_internals_that_do_not_follow_semver.d.ts'

const PUBLIC_ENTRIES: Record<string, string> = {
  'sanity': 'index.d.ts',
  'sanity/structure': 'structure.d.ts',
  'sanity/router': 'router.d.ts',
}

const SCANNED_DIRS = [
  'packages/sanity/src',
  'packages/sanity/test',
  'packages/@sanity/vision/src',
  'dev',
  'examples',
  'perf',
  'e2e',
]

const SKIPPED_DIRS = new Set(['node_modules', 'lib', 'dist', '.sanity', 'storybook-static'])
const SOURCE_FILE = /\.(ts|tsx|mts|cts|js|jsx|mjs)$/

function isInternal(declaration: ExportedDeclarations): boolean {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  return docs.some((doc) => doc.getTags().some((tag) => tag.getTagName() === 'internal'))
}

function internalNamesOf(dtsFile: string, onInternalsEntry: Set<string>): Set<string> {
  const project = new Project({skipAddingFilesFromTsConfig: true})
  const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
  const names = new Set<string>()
  for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
    if (!onInternalsEntry.has(name)) continue
    const own = declarations.filter((declaration) =>
      declaration.getSourceFile().getFilePath().startsWith(sanityLibDir),
    )
    if (own.length > 0 && own.some(isInternal)) names.add(name)
  }
  return names
}

function internalsEntryNames(): Set<string> {
  const project = new Project({skipAddingFilesFromTsConfig: true})
  const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, INTERNALS_ENTRY_DTS))
  return new Set(sourceFile.getExportedDeclarations().keys())
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) yield* walk(full)
    } else if (SOURCE_FILE.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      yield full
    }
  }
}

type Hit = {specifier: string; names: string[]}

/** Climbs out of `await`, parentheses, `as` casts and `!` so the parent is the real consumer. */
function consumerOf(node: ts.Node): ts.Node {
  let current = node
  while (
    ts.isAwaitExpression(current.parent) ||
    ts.isParenthesizedExpression(current.parent) ||
    ts.isAsExpression(current.parent) ||
    ts.isNonNullExpression(current.parent)
  ) {
    current = current.parent
  }
  return current
}

function bindingNames(pattern: ts.ObjectBindingPattern): string[] {
  return pattern.elements.flatMap((element) => {
    const name = element.propertyName ?? element.name
    return ts.isIdentifier(name) ? [name.text] : []
  })
}

/** `S.name` (value position) and `S.Name` (type position) for the identifier `namespace`. */
function memberNames(scope: ts.Node, namespace: string): string[] {
  const names: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === namespace
    ) {
      names.push(node.name.text)
    } else if (
      ts.isQualifiedName(node) &&
      ts.isIdentifier(node.left) &&
      node.left.text === namespace
    ) {
      names.push(node.right.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(scope)
  return names
}

/** Names read off the module object that `moduleExpression` (an `import()` call) evaluates to. */
function dynamicModuleNames(moduleExpression: ts.Node): string[] {
  const expression = consumerOf(moduleExpression)
  const consumer = expression.parent
  if (ts.isVariableDeclaration(consumer) && ts.isObjectBindingPattern(consumer.name)) {
    return bindingNames(consumer.name)
  }
  if (ts.isPropertyAccessExpression(consumer) && consumer.expression === expression) {
    if (consumer.name.text !== 'then') return [consumer.name.text]
    const call = consumer.parent
    if (!ts.isCallExpression(call) || call.expression !== consumer) return []
    const [callback] = call.arguments
    if (!callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))) {
      return []
    }
    const [parameter] = callback.parameters
    if (!parameter) return []
    if (ts.isObjectBindingPattern(parameter.name)) return bindingNames(parameter.name)
    if (ts.isIdentifier(parameter.name)) return memberNames(callback.body, parameter.name.text)
  }
  return []
}

/** The entry an `import('…')` call (or a call of a module-scope alias for one) loads. */
function dynamicImportSpecifier(node: ts.Node, aliases: Map<string, string>): string | undefined {
  if (!ts.isCallExpression(node)) return undefined
  if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    const [argument] = node.arguments
    return argument && ts.isStringLiteral(argument) ? argument.text : undefined
  }
  return ts.isIdentifier(node.expression) ? aliases.get(node.expression.text) : undefined
}

/** `const load = () => import('sanity')` (expression or single-`return` body) → `load` → 'sanity'. */
function importAliases(source: ts.SourceFile): Map<string, string> {
  const aliases = new Map<string, string>()
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer
      if (!ts.isIdentifier(declaration.name) || !initializer) continue
      if (!ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer)) continue
      let body: ts.Node | undefined = initializer.body
      if (ts.isBlock(body)) {
        const [only] = body.statements
        body = only && ts.isReturnStatement(only) ? only.expression : undefined
      }
      while (body && ts.isParenthesizedExpression(body)) body = body.expression
      const specifier = body && dynamicImportSpecifier(body, new Map())
      if (specifier) aliases.set(declaration.name.text, specifier)
    }
  }
  return aliases
}

function importedNames(file: string, entries: Record<string, Set<string>>): Hit[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const hits: Hit[] = []
  const report = (specifier: string, candidates: string[]) => {
    const internal = entries[specifier]
    if (!internal) return
    const names = [...new Set(candidates.filter((name) => internal.has(name)))]
    if (names.length > 0) hits.push({specifier, names})
  }

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }
    const specifier = statement.moduleSpecifier.text
    const bindings = statement.importClause?.namedBindings
    if (!bindings) continue
    if (ts.isNamedImports(bindings)) {
      report(
        specifier,
        bindings.elements.map((element) => (element.propertyName ?? element.name).text),
      )
    } else if (entries[specifier]) {
      report(specifier, memberNames(source, bindings.name.text))
    }
  }

  const aliases = importAliases(source)
  const visit = (node: ts.Node) => {
    const specifier = dynamicImportSpecifier(node, aliases)
    if (specifier && entries[specifier]) report(specifier, dynamicModuleNames(node))
    ts.forEachChild(node, visit)
  }
  visit(source)

  return hits
}

describe('repo code does not import @internal symbols from the public entries', () => {
  const onInternalsEntry = internalsEntryNames()
  const entries = Object.fromEntries(
    Object.entries(PUBLIC_ENTRIES).map(([entry, dtsFile]) => [
      entry,
      internalNamesOf(dtsFile, onInternalsEntry),
    ]),
  )

  for (const dir of SCANNED_DIRS) {
    test(dir, () => {
      const offenders: string[] = []
      for (const file of walk(path.join(repoRoot, dir))) {
        for (const {specifier, names} of importedNames(file, entries)) {
          offenders.push(
            `${path.relative(repoRoot, file)}: {${names.join(', ')}} from '${specifier}'`,
          )
        }
      }
      expect(
        offenders,
        `Import @internal symbols relatively (inside packages/sanity) or from sanity/_dangerously_use_private_internals_that_do_not_follow_semver (everywhere else), not from the public entries.`,
      ).toEqual([])
    })
  }
})

/**
 * The scanner itself, on fixtures: one case per import form it claims to cover, each with a
 * public name as a control, plus the forms it must leave alone. Without this the repo-wide
 * tests above would stay green if `importedNames` stopped finding anything.
 */
describe('importedNames', () => {
  const entries: Record<string, Set<string>> = {
    'sanity': new Set(['useEditState', 'LoadingBlock']),
    'sanity/structure': new Set(['useDocumentPane']),
    'sanity/router': new Set(['decodeJsonParams']),
  }

  const cases: {name: string; source: string; expected: Hit[]}[] = [
    {
      name: 'named import',
      source: `import {defineConfig, useEditState, type LoadingBlock} from 'sanity'\n`,
      expected: [{specifier: 'sanity', names: ['useEditState', 'LoadingBlock']}],
    },
    {
      name: 'named import with an alias',
      source: `import {useEditState as useState} from 'sanity'\n`,
      expected: [{specifier: 'sanity', names: ['useEditState']}],
    },
    {
      name: 'namespace import, value and type position',
      source: [
        `import * as S from 'sanity'`,
        `export const a = S.useEditState`,
        `export const b = S.defineConfig({})`,
        `export type C = S.Schema`,
        `export type D = S.LoadingBlock`,
      ].join('\n'),
      expected: [{specifier: 'sanity', names: ['useEditState', 'LoadingBlock']}],
    },
    {
      name: 'dynamic import, destructured',
      source: `export async function f() { const {useDocumentPane, usePaneRouter} = await import('sanity/structure'); return [useDocumentPane, usePaneRouter] }\n`,
      expected: [{specifier: 'sanity/structure', names: ['useDocumentPane']}],
    },
    {
      name: 'dynamic import, property access through await, parentheses and a non-null assertion',
      source: `export async function f() { return (await import('sanity/router'))!.decodeJsonParams }\n`,
      expected: [{specifier: 'sanity/router', names: ['decodeJsonParams']}],
    },
    {
      name: 'dynamic import handed to then() with a parameter',
      source: `export const p = import('sanity').then((m) => ({default: m.useEditState, other: m.defineConfig}))\n`,
      expected: [{specifier: 'sanity', names: ['useEditState']}],
    },
    {
      name: 'dynamic import handed to then() with a destructuring parameter',
      source: `export const p = import('sanity').then(({useEditState, defineConfig}) => [useEditState, defineConfig])\n`,
      expected: [{specifier: 'sanity', names: ['useEditState']}],
    },
    {
      name: 'dynamic import through a module-scope arrow alias',
      source: [
        `const load = () => import('sanity')`,
        `export async function f() { const {useEditState} = await load(); return useEditState }`,
        `export const p = load().then((m) => m.LoadingBlock)`,
      ].join('\n'),
      expected: [
        {specifier: 'sanity', names: ['useEditState']},
        {specifier: 'sanity', names: ['LoadingBlock']},
      ],
    },
    {
      name: 'dynamic import through a module-scope alias with a return statement',
      source: [
        `const load = function () { return import('sanity/structure') }`,
        `export const p = load().then(({useDocumentPane}) => useDocumentPane)`,
      ].join('\n'),
      expected: [{specifier: 'sanity/structure', names: ['useDocumentPane']}],
    },
    {
      name: 'public names only',
      source: [
        `import {defineConfig} from 'sanity'`,
        `import * as S from 'sanity/structure'`,
        `export const a = S.usePaneRouter`,
        `export const p = import('sanity/router').then((m) => m.useRouter)`,
      ].join('\n'),
      expected: [],
    },
    {
      name: 'other modules',
      source: [
        `import {useEditState} from 'other'`,
        `import * as S from 'sanity-plugin-x'`,
        `export const a = S.useEditState`,
        `export const p = import('./local').then((m) => m.useEditState)`,
      ].join('\n'),
      expected: [],
    },
  ]

  let dir: string
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-internal-imports-'))
  })
  afterAll(() => {
    fs.rmSync(dir, {recursive: true, force: true})
  })

  for (const [index, {name, source, expected}] of cases.entries()) {
    test(name, () => {
      const file = path.join(dir, `case-${index}.tsx`)
      fs.writeFileSync(file, source)
      expect(importedNames(file, entries)).toEqual(expected)
    })
  }
})
