/**
 * The public `sanity` entries must not export declarations tagged `@internal`, and
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` must export nothing else.
 * Internal symbols live on the internals entry so that studios and plugins that reach for them
 * opt in to the "does not follow semver" contract, and so the public entries only pull the code
 * that is actually part of the public API into a studio bundle.
 *
 * Runs against the built `.d.ts` files, so it checks what consumers see (including symbols that
 * reach the barrel through intermediate re-exports). Symbols re-exported from dependencies are
 * skipped: their release tags belong to the dependency. Type-only exports count too: a type
 * import of a removed symbol breaks a consumer's build just like a value import breaks its
 * bundle. `PUBLIC_BY_USAGE` lists the deliberate exceptions.
 */
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type ExportedDeclarations, Node, Project} from 'ts-morph'
import {describe, expect, test} from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sanityLibDir = path.resolve(__dirname, '../../../sanity/lib')

const INTERNALS_ENTRY_DTS = '_dangerously_use_private_internals_that_do_not_follow_semver.d.ts'

const PUBLIC_ENTRIES = {
  'sanity': 'index.d.ts',
  'sanity/structure': 'structure.d.ts',
  'sanity/router': 'router.d.ts',
  'sanity/presentation': 'presentation.d.ts',
}

/**
 * `@internal` declarations that deliberately stay on a public entry: deprecated utilities that
 * studios should stop using. The `@internal @deprecated` tags on the `sanity` export are the
 * message to customers (see #14842), and keeping them off the internals entry keeps the
 * deprecated import the only one; their removal is governed by the deprecation, not by the
 * internals moving. `createAuthStore` (deprecated since v3.15.0) and its options type are the
 * only ones today.
 */
const PUBLIC_BY_USAGE: Record<string, readonly string[]> = {
  sanity: ['createAuthStore', 'CreateAuthStoreOptions'],
}

function isInternal(declaration: ExportedDeclarations): boolean {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  return docs.some((doc) => doc.getTags().some((tag) => tag.getTagName() === 'internal'))
}

function ownDeclarations(declarations: ExportedDeclarations[]): ExportedDeclarations[] {
  return declarations.filter((declaration) =>
    declaration.getSourceFile().getFilePath().startsWith(sanityLibDir),
  )
}

describe('the @internal release tag decides which entry a declaration is exported from', () => {
  const project = new Project({skipAddingFilesFromTsConfig: true})

  for (const [entry, dtsFile] of Object.entries(PUBLIC_ENTRIES)) {
    test(`${entry} exports no @internal declarations`, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const publicByUsage = new Set(PUBLIC_BY_USAGE[entry] ?? [])
      const internalExports: string[] = []
      for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        if (publicByUsage.has(name)) continue
        const own = ownDeclarations(declarations)
        if (own.length > 0 && own.some(isInternal)) internalExports.push(name)
      }
      expect(
        internalExports,
        `\`${entry}\` exports @internal declarations. Move them to src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts, or retag them if they are meant to be public.`,
      ).toEqual([])
    })
  }

  test('everything on the internals entry is tagged @internal', () => {
    const internalsEntry = project.addSourceFileAtPath(path.join(sanityLibDir, INTERNALS_ENTRY_DTS))
    const notInternal: string[] = []
    for (const [name, declarations] of internalsEntry.getExportedDeclarations()) {
      const own = ownDeclarations(declarations)
      if (own.length > 0 && !own.some(isInternal)) notInternal.push(name)
    }
    expect(
      notInternal,
      'The internals entry is for @internal declarations only; public symbols stay on the public entries.',
    ).toEqual([])
  })
})
