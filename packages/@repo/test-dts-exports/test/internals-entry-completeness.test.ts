/**
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` must export every
 * declaration that a public `sanity` entry exports under the `@internal` release tag. The public
 * entries keep exporting those symbols for now; the internals entry is the migration target for
 * consumers that reach for them, so it has to be complete before the public entries can drop them
 * in a future major.
 *
 * Runs against the built `.d.ts` files, so it checks what consumers see (including symbols that
 * reach the barrel through intermediate re-exports). Symbols re-exported from dependencies are
 * skipped: their release tags belong to the dependency. Type-only exports count too: a type import
 * of a removed symbol breaks a consumer's build just like a value import breaks its bundle.
 * `PUBLIC_BY_USAGE` lists the deliberate exceptions.
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
 * `@internal` exports of a public entry that deliberately stay off the internals entry: deprecated
 * utilities that studios import from `sanity` as documented, so their removal is governed by the
 * deprecation, not by the internals moving. `createAuthStore` (deprecated since v3.15.0, tagged
 * on its re-export in `index.ts` by #14842) and its options type are the only ones today.
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

describe('the internals entry exports every @internal declaration of the public entries', () => {
  const project = new Project({skipAddingFilesFromTsConfig: true})
  const internalsEntry = project.addSourceFileAtPath(path.join(sanityLibDir, INTERNALS_ENTRY_DTS))
  const internalsExports = internalsEntry.getExportedDeclarations()

  for (const [entry, dtsFile] of Object.entries(PUBLIC_ENTRIES)) {
    test(entry, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const publicByUsage = new Set(PUBLIC_BY_USAGE[entry] ?? [])
      const missing: string[] = []
      const mismatched: string[] = []
      for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        if (publicByUsage.has(name)) continue
        const own = ownDeclarations(declarations)
        if (own.length === 0 || !own.some(isInternal)) continue

        const onInternalsEntry = ownDeclarations(internalsExports.get(name) ?? [])
        if (onInternalsEntry.length === 0) {
          missing.push(name)
          continue
        }
        // Same name must point at the same declaration, not a namesake from another module
        const sameDeclaration = own.every((declaration) =>
          onInternalsEntry.some(
            (candidate) =>
              candidate.getSourceFile().getFilePath() ===
                declaration.getSourceFile().getFilePath() &&
              candidate.getStart() === declaration.getStart(),
          ),
        )
        if (!sameDeclaration) mismatched.push(name)
      }
      expect(
        missing,
        `\`${entry}\` exports @internal declarations that are missing from \`sanity/_dangerously_use_private_internals_that_do_not_follow_semver\`. Add them to packages/sanity/src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts (or retag them if they are meant to be public).`,
      ).toEqual([])
      expect(
        mismatched,
        `\`${entry}\` and the internals entry export different declarations under the same name.`,
      ).toEqual([])
    })
  }

  test('everything on the internals entry is tagged @internal', () => {
    const notInternal: string[] = []
    for (const [name, declarations] of internalsExports) {
      const own = ownDeclarations(declarations)
      if (own.length > 0 && !own.some(isInternal)) notInternal.push(name)
    }
    expect(
      notInternal,
      'The internals entry is for @internal declarations only; public symbols stay on the public entries.',
    ).toEqual([])
  })
})
