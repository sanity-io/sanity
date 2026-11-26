/**
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` is the canonical import
 * path for everything the Studio exports as an implementation detail. The public entries hide
 * the *runtime* ones. Studio 6 kept the ones published plugins import on the public entries too,
 * because a missing named export is an ESM *link* error that stops the studio booting, and
 * auto-updating studios pick up a minor without a rebuild; Studio 7 drops them.
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
 * `sanity/structure`, `sanity/router` and `sanity/presentation` are the exception: Studio 7 moves
 * their types too, to subpaths of the internals entry (see the last test in this file).
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
import {beforeAll, describe, expect, test} from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sanityLibDir = path.resolve(__dirname, '../../../sanity/lib')

const INTERNALS_ENTRY_DTS = '_dangerously_use_private_internals_that_do_not_follow_semver.d.ts'

const PUBLIC_ENTRIES = {
  'sanity': 'index.d.ts',
  'sanity/structure': 'structure.d.ts',
  'sanity/router': 'router.d.ts',
  'sanity/presentation': 'presentation.d.ts',
  'sanity/i18n': 'i18n.d.ts',
}

/**
 * `@internal` *runtime* declarations that stay reachable from a public entry, and why. Everything
 * listed here must also be exported from the internals entry, which is the path to migrate to.
 *
 * Studio v7 keeps none: the names v6 kept for published plugins are only on the internals entry,
 * so a plugin that still imports one from a public entry fails to link until it moves the import.
 * Type-only declarations are not listed here — see the note at the top of the file.
 */
const KEPT_FOR_COMPATIBILITY: Record<string, Readonly<Record<string, string>>> = {}

/**
 * Exports that stay on a public entry *without* a matching internals-entry line, because the
 * deprecated `sanity` import is deliberately the only one: that keeps the deprecation the single
 * message, and makes removal governed by the deprecation rather than by the internals moving
 * (the reasoning in #14842). There are none today — #16046 removed the last one.
 */
const NOT_ON_INTERNALS_ENTRY: Record<string, readonly string[]> = {}

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

/**
 * Studio 7 keeps implementation details off `sanity/structure`, `sanity/router` and
 * `sanity/presentation`, types included: whatever is tagged `@internal`, `@hidden` or
 * `@deprecated` is exported from the matching subpath of the internals entry instead. Unlike the
 * checks above, these cover declarations re-exported from dependencies too, because the entry
 * decides what it re-exports.
 */
const PRIVATE_SUBPATHS = {
  'sanity/structure': 'structure',
  'sanity/router': 'router',
  'sanity/presentation': 'presentation',
} as const

const PRIVATE_TAGS = new Set(['internal', 'hidden', 'deprecated'])

function privateTagsOf(declaration: ExportedDeclarations): string[] {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  return docs.flatMap((doc) =>
    doc
      .getTags()
      .map((tag) => tag.getTagName())
      .filter((tag) => PRIVATE_TAGS.has(tag)),
  )
}

/** Binding the built `.d.ts` files and the chunks they import takes seconds on a CI runner. */
const DTS_PARSE_TIMEOUT = 60_000

describe('structure, router and presentation keep their internals on subpaths', () => {
  /** Built `.d.ts` file → export name → whether one of its declarations has a private tag. */
  const privacyByFile = new Map<string, Map<string, boolean>>()
  const dtsFilesOf = (subpath: string) => ({
    entry: `${subpath}.d.ts`,
    internals: path.join(
      '_dangerously_use_private_internals_that_do_not_follow_semver',
      `${subpath}.d.ts`,
    ),
  })
  const exportsOf = (dtsFile: string, isPrivate: boolean) =>
    [...(privacyByFile.get(dtsFile) ?? [])]
      .filter(([, privateExport]) => privateExport === isPrivate)
      .map(([name]) => name)

  beforeAll(() => {
    const project = new Project({skipAddingFilesFromTsConfig: true})
    for (const subpath of Object.values(PRIVATE_SUBPATHS)) {
      for (const dtsFile of Object.values(dtsFilesOf(subpath))) {
        const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
        privacyByFile.set(
          dtsFile,
          new Map(
            [...sourceFile.getExportedDeclarations()].map(([name, declarations]) => [
              name,
              declarations.some((declaration) => privateTagsOf(declaration).length > 0),
            ]),
          ),
        )
      }
    }
  }, DTS_PARSE_TIMEOUT)

  for (const [entry, subpath] of Object.entries(PRIVATE_SUBPATHS)) {
    const internalsSubpath = `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/${subpath}`
    const dtsFiles = dtsFilesOf(subpath)

    test(`${entry} exports nothing tagged @internal, @hidden or @deprecated`, () => {
      expect(
        exportsOf(dtsFiles.entry, true),
        `Move these exports from \`${entry}\` to \`${internalsSubpath}\`.`,
      ).toEqual([])
    })

    test(`${internalsSubpath} exports only declarations tagged @internal, @hidden or @deprecated`, () => {
      expect(privacyByFile.get(dtsFiles.internals)?.size).toBeGreaterThan(0)
      expect(
        exportsOf(dtsFiles.internals, false),
        `These exports are public API: export them from \`${entry}\` instead.`,
      ).toEqual([])
    })
  }
})
