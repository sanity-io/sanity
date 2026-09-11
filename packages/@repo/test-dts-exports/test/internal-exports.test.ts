/**
 * The public `sanity` entries must not export declarations tagged `@internal`. Internal
 * symbols live on `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`, so that
 * studios and plugins that reach for them opt in to the "does not follow semver" contract, and so
 * the public entries only pull the code that is actually part of the public API into a studio
 * bundle.
 *
 * Runs against the built `.d.ts` files, so it checks what consumers see (including symbols that
 * reach the barrel through intermediate re-exports). Symbols re-exported from dependencies are
 * skipped: their release tags belong to the dependency.
 */
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type ExportedDeclarations, Node, Project} from 'ts-morph'
import {describe, expect, test} from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sanityLibDir = path.resolve(__dirname, '../../../sanity/lib')

const PUBLIC_ENTRIES = {
  'sanity': 'index.d.ts',
  'sanity/structure': 'structure.d.ts',
  'sanity/router': 'router.d.ts',
  'sanity/presentation': 'presentation.d.ts',
}

function isInternal(declaration: ExportedDeclarations): boolean {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  return docs.some((doc) => doc.getTags().some((tag) => tag.getTagName() === 'internal'))
}

describe('public entries do not export @internal declarations', () => {
  const project = new Project({skipAddingFilesFromTsConfig: true})

  for (const [entry, dtsFile] of Object.entries(PUBLIC_ENTRIES)) {
    test(entry, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const internalExports: string[] = []
      for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        const ownDeclarations = declarations.filter((declaration) =>
          declaration.getSourceFile().getFilePath().startsWith(sanityLibDir),
        )
        if (ownDeclarations.length > 0 && ownDeclarations.some(isInternal)) {
          internalExports.push(name)
        }
      }
      expect(
        internalExports,
        `\`${entry}\` exports @internal declarations. Move them to src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts, or retag them if they are meant to be public.`,
      ).toEqual([])
    })
  }
})
