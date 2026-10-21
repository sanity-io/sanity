/**
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` is the canonical import
 * path for everything the Studio exports as an implementation detail. The public entries hide
 * the *runtime* ones, with one exception: a name a published plugin already imports from a public
 * entry stays there, because a missing named export is an ESM *link* error that stops the studio
 * booting, and auto-updating studios pick up a minor without a rebuild.
 *
 * Three invariants, all checked against the built `.d.ts` files so they see what consumers see
 * (including symbols that reach a barrel through intermediate re-exports):
 *
 * 1. **Superset.** Every `@internal` declaration a public entry exports is also exported from the
 *    internals entry, under the same declaration. That makes the internals entry a working import
 *    path for every internal, which is what we tell consumers to migrate to.
 * 2. **Explicit compatibility list.** Every `@internal` *runtime* declaration still reachable from
 *    a public entry is listed in `KEPT_FOR_COMPATIBILITY` below, with the reason. A new one cannot
 *    appear by accident, and the list is the removal checklist for the next major.
 * 3. **No stale list entries.**
 *
 * Type-only declarations — interfaces and `type` aliases — are deliberately *not* governed by the
 * list. Per SAPP-4893, exports move for two reasons: bundle size, which only applies to runtime
 * exports because types compile away, and discouraging use. A type costs nothing at cold start,
 * so moving one buys no bytes and only costs breakage. They stay on the entry that exported them,
 * and are re-exported from the internals entry as well. A type moves only when it describes
 * something nobody outside Sanity should need, and even then leaving it is acceptable.
 *
 * The internals entry is deliberately *not* checked for "nothing but `@internal` here": versions
 * 6.17.0 through 6.20.0 shipped it as the migration target for names that have since become
 * public API, and a re-export costs nothing, so those stay exported from both places.
 *
 * Symbols re-exported from dependencies are skipped: their release tags belong to the dependency.
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
 * `@internal` *runtime* declarations that stay reachable from a public entry, and why. Everything
 * here is also exported from the internals entry, which is the path to migrate to; these bindings
 * exist so that upgrading `sanity` alone cannot stop a studio from booting.
 *
 * The package list comes from packing every `sanity-plugin-*` and `@sanity/*` package the npm
 * registry returns (312 packages) and scanning the shipped `dist` for named imports of the names
 * this stack moves. Drop a name once the packages behind it no longer import it; the next major
 * drops the rest.
 *
 * Type-only declarations are not listed here — see the note at the top of the file.
 */
const KEPT_FOR_COMPATIBILITY: Record<string, Readonly<Record<string, string>>> = {
  'sanity': {
    // Deprecated since Studio v3.15.0; the `@internal @deprecated` tags on the `sanity` export
    // are the message to customers (#14842), so the deprecated import stays the only one.
    createAuthStore: 'deprecated public utility (#14842)',

    CommandList: '@sanity/agent-context, @sanity/context',
    ContextMenuButton: '@sanity/vision, sanity-plugin-s3-media',
    FieldPresenceWithOverlay: 'sanity-plugin-icon-manager, sanity-plugin-inline-icon-manager',
    LoadingBlock: 'sanity-plugin-s3-media',
    MemberFieldSet: 'sanity-plugin-google-translate',
    ObjectInputMembers: 'sanity-plugin-image-field',
    RELEASES_STUDIO_CLIENT_OPTIONS: '@sanity/vision',
    SANITY_PATCH_TYPE: 'sanity-plugin-pt-string, sanity-plugin-rich-table',
    VARIANTS_STUDIO_CLIENT_OPTIONS: '@sanity/vision',
    _isType: 'sanity-plugin-s3-media',
    defineLocalesResources: '@sanity/vision',
    getAnnotationAtPath: 'sanity-plugin-google-maps-zoom',
    getDefaultVariant: '@sanity/vision',
    getValueAtPath: '@sanity/agent-context, @sanity/context',
    getVariantTitle: '@sanity/vision',
    isArray: 'sanity-plugin-table-of-contents',
    isCardinalityOneRelease: '@sanity/vision',
    isDraft: 'sanity-plugin-phrase',
    isString: 'sanity-plugin-table-of-contents',
    prefixPath:
      '@sanity/hierarchical-document-list, sanity-plugin-melting-hierarchical-document-list',
    prepareForPreview: 'sanity-plugin-phrase',
    resolveInitialValue: '@sanity/workflow-studio-plugin',
    sortReleases: '@sanity/vision',
    useActiveReleases: '@sanity/vision, @sanity/workflow-studio-plugin',
    useColorScheme: 'sanity-plugin-netlify, sanity-plugin-seofields, sanity-plugin-media-test-2',
    useDocumentValuePermissions: 'sanity-plugin-trash',
    useInitialValueResolverContext: '@sanity/workflow-studio-plugin',
    useIsReleaseActive: '@sanity/workflow-studio-plugin',
    useKeyValueStore: '@sanity/vision',
    useScheduledDraftsEnabled: '@sanity/vision',
    useSource: '@sanity/workflow-studio, sanity-plugin-prefixed-slug',
    useUserColor: 'sanity-plugin-google-maps-zoom',
    useValuePreview: '@sanity/workflow-studio-plugin, sanity-plugin-link-checker',
    useWorkspaces: '@sanity/cross-dataset-duplicator, sanity-plugin-workspace-home',

    // Already deprecated before this PR. Their removal is governed by their own deprecation —
    // several say "the next major" in so many words — rather than by the internals moving, which
    // is the same reasoning #14842 applied to `createAuthStore`.
    defaultTheme: 'deprecated; removal governed by its deprecation',
    EditScheduleForm: 'deprecated; removal governed by its deprecation',
    ImperativeToast: 'deprecated; removal governed by its deprecation',
    isPerspectiveRaw: 'deprecated; removal governed by its deprecation',
    ObjectMembers: 'deprecated; removal governed by its deprecation',
    unstable_useObserveDocument: 'deprecated alias of useUnstableObserveDocument, which stays',
    unstable_useValuePreview: 'deprecated alias of useValuePreview, which stays',
    useEnhancedObjectDialog: 'deprecated; removal governed by its deprecation',
    useSearchMaxFieldDepth: 'deprecated; removal governed by its deprecation',
    useTimelineSelector: 'deprecated; removal governed by its deprecation',
    useTimelineStore: 'deprecated; removal governed by its deprecation',
    useUnique: 'deprecated; removal governed by its deprecation',

    useColorSchemeOptions: 'companion of useColorScheme (a function, not a type)',
  },
  'sanity/router': {
    // Deprecated before this PR; see the note above.
    WithRouter: 'deprecated; removal governed by its deprecation',
    withRouter: 'deprecated; removal governed by its deprecation',
  },
  'sanity/structure': {
    getOrderingMenuItemsForSchemaType: 'sanity-plugin-md-notes',
    useStructureTool: 'sanity-plugin-structure-inbox',
  },
}

/**
 * `createAuthStore` is deliberately *not* on the internals entry: #14842 keeps the deprecated
 * `sanity` import the only one so the deprecation is the single message to customers, and its
 * removal is governed by that deprecation rather than by the internals moving.
 */
const NOT_ON_INTERNALS_ENTRY: Record<string, readonly string[]> = {
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

/**
 * An interface or a `type` alias: it exists only in the type system, so a public entry can keep
 * exporting it without costing a studio any bytes at cold start.
 */
function isTypeOnly(declarations: ExportedDeclarations[]): boolean {
  return declarations.every(
    (declaration) =>
      Node.isInterfaceDeclaration(declaration) || Node.isTypeAliasDeclaration(declaration),
  )
}

function sameDeclaration(a: ExportedDeclarations[], b: ExportedDeclarations[]): boolean {
  return a.every((declaration) =>
    b.some(
      (candidate) =>
        candidate.getSourceFile().getFilePath() === declaration.getSourceFile().getFilePath() &&
        candidate.getStart() === declaration.getStart(),
    ),
  )
}

describe('the internals entry is a superset, and the public compatibility list is explicit', () => {
  const project = new Project({skipAddingFilesFromTsConfig: true})
  const internalsEntry = project.addSourceFileAtPath(path.join(sanityLibDir, INTERNALS_ENTRY_DTS))
  const internalsExports = internalsEntry.getExportedDeclarations()

  for (const [entry, dtsFile] of Object.entries(PUBLIC_ENTRIES)) {
    const kept = KEPT_FOR_COMPATIBILITY[entry] ?? {}

    test(`every @internal declaration on ${entry} is also on the internals entry`, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const exempt = new Set(NOT_ON_INTERNALS_ENTRY[entry] ?? [])
      const missing: string[] = []
      const mismatched: string[] = []
      for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        if (exempt.has(name)) continue
        const own = ownDeclarations(declarations)
        if (own.length === 0 || !own.some(isInternal)) continue
        const onEntry = ownDeclarations(internalsExports.get(name) ?? [])
        if (onEntry.length === 0) {
          missing.push(name)
        } else if (!sameDeclaration(own, onEntry)) {
          mismatched.push(name)
        }
      }
      expect(
        missing,
        `\`${entry}\` exports @internal declarations that the internals entry does not. Add them to src/_exports/_dangerously_use_private_internals_that_do_not_follow_semver.ts so there is a supported import path for them.`,
      ).toEqual([])
      expect(
        mismatched,
        `\`${entry}\` and the internals entry export different declarations under the same name.`,
      ).toEqual([])
    })

    test(`${entry} keeps only the listed @internal runtime declarations`, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const unlisted: string[] = []
      for (const [name, declarations] of sourceFile.getExportedDeclarations()) {
        if (name in kept) continue
        const own = ownDeclarations(declarations)
        if (own.length === 0 || !own.some(isInternal)) continue
        // Types compile away, so they are free to stay here; only runtime exports cost bytes.
        if (isTypeOnly(own)) continue
        unlisted.push(name)
      }
      expect(
        unlisted,
        `\`${entry}\` exports @internal runtime declarations that are not in KEPT_FOR_COMPATIBILITY. Either move them to the internals entry, or add them to the list with the package that needs them. (Interfaces and type aliases do not need listing.)`,
      ).toEqual([])
    })

    test(`${entry}'s compatibility list has no stale entries`, () => {
      const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
      const exported = new Set(sourceFile.getExportedDeclarations().keys())
      const stale = Object.keys(kept).filter((name) => !exported.has(name))
      expect(
        stale,
        `KEPT_FOR_COMPATIBILITY lists names \`${entry}\` no longer exports. Drop them from the list.`,
      ).toEqual([])
    })
  }
})
