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
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type ExportedDeclarations, Node, Project} from 'ts-morph'
import ts from 'typescript'
import {describe, expect, test} from 'vitest'

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

function importedNames(
  file: string,
  entries: Record<string, Set<string>>,
): {specifier: string; names: string[]}[] {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    false,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const hits: {specifier: string; names: string[]}[] = []
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue
    }
    const specifier = statement.moduleSpecifier.text
    const internal = entries[specifier]
    if (!internal) continue
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    const names = bindings.elements
      .map((element) => (element.propertyName ?? element.name).text)
      .filter((name) => internal.has(name))
    if (names.length > 0) hits.push({specifier, names})
  }
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
