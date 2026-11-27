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
 * The reverse holds as well: nothing exported from an internals entry is tagged `@public`, `@beta`
 * or `@alpha` (the last test in this file). Every name has a single home, so a name people were
 * told they can rely on lives on a public entry, and the internals entries hold only what can
 * change in any release.
 *
 * Symbols re-exported from dependencies are skipped: their release tags belong to the dependency.
 */
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {type ExportedDeclarations, Node, Project} from 'ts-morph'
import {beforeAll, describe, expect, test} from 'vitest'

import {isTombstoneDeclaration, readManifest} from '../tombstones/surface.mjs'

const manifest = readManifest()

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
 * `sanity/presentation`, types included: whatever is tagged `@internal`, or `@hidden` or
 * `@deprecated` without a release tag, is exported from the matching subpath of the internals
 * entry instead (a `@hidden @beta` name is public API and stays on the subpath), and the
 * public entry keeps a `never` tombstone that names the new path (`test/tombstones.test.ts` covers
 * those). Unlike the checks above, these cover declarations re-exported from dependencies too,
 * because the entry decides what it re-exports. The one kind of public declaration a subpath may
 * export is the runtime value of a public type that its entry only exports type-only, which the
 * manifest lists under `typeOnly` (the Structure Builder classes).
 */
const PRIVATE_SUBPATHS = {
  'sanity/structure': 'structure',
  'sanity/router': 'router',
  'sanity/presentation': 'presentation',
} as const

/** Subpaths that have no internals left, and so no internals entry to check. */
const SUBPATHS_WITHOUT_INTERNALS = new Set<string>(['presentation'])

const PRIVATE_TAGS = new Set(['internal', 'hidden', 'deprecated'])

function privateTagsOf(declaration: ExportedDeclarations): string[] {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  const tags = docs.flatMap((doc) => doc.getTags().map((tag) => tag.getTagName()))
  // `@hidden` and `@deprecated` names that carry a release tag (`@hidden @beta`) are public API
  const released = tags.some((tag) => tag === 'public' || tag === 'beta' || tag === 'alpha')
  return tags.filter((tag) => PRIVATE_TAGS.has(tag) && (tag === 'internal' || !released))
}

/** Binding the built `.d.ts` files and the chunks they import takes seconds on a CI runner. */
const DTS_PARSE_TIMEOUT = 60_000

describe('structure, router and presentation keep their internals on subpaths', () => {
  /**
   * Built `.d.ts` file → export name → whether one of its declarations has a private tag.
   * Tombstones are left out.
   */
  const privacyByFile = new Map<string, Map<string, boolean>>()
  const dtsFilesOf = (subpath: string) => ({
    entry: `${subpath}.d.ts`,
    internals: SUBPATHS_WITHOUT_INTERNALS.has(subpath)
      ? null
      : `_dangerously_use_private_internals_that_do_not_follow_semver-${subpath}.d.ts`,
  })
  const exportsOf = (dtsFile: string, isPrivate: boolean) =>
    [...(privacyByFile.get(dtsFile) ?? [])]
      .filter(([, privateExport]) => privateExport === isPrivate)
      .map(([name]) => name)

  beforeAll(() => {
    const project = new Project({skipAddingFilesFromTsConfig: true})
    for (const subpath of Object.values(PRIVATE_SUBPATHS)) {
      for (const dtsFile of Object.values(dtsFilesOf(subpath))) {
        if (!dtsFile) continue
        const sourceFile = project.addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
        privacyByFile.set(
          dtsFile,
          new Map(
            [...sourceFile.getExportedDeclarations()]
              .filter(([, declarations]) => !declarations.every(isTombstoneDeclaration))
              .map(([name, declarations]) => [
                name,
                declarations.some((declaration) => privateTagsOf(declaration).length > 0),
              ]),
          ),
        )
      }
    }
  }, DTS_PARSE_TIMEOUT)

  for (const [entry, subpath] of Object.entries(PRIVATE_SUBPATHS)) {
    const internalsSubpath = `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-${subpath}`
    const dtsFiles = dtsFilesOf(subpath)

    test(`${entry} exports nothing private`, () => {
      expect(
        exportsOf(dtsFiles.entry, true),
        `Move these exports to \`${internalsSubpath}\` and leave a tombstone on \`${entry}\`.`,
      ).toEqual([])
    })

    const internalsDtsFile = dtsFiles.internals
    if (!internalsDtsFile) continue

    test(`${internalsSubpath} exports only private declarations`, () => {
      const valuesOfPublicTypes = new Set(
        (manifest.typeOnly?.[`./${subpath}`] ?? [])
          .filter(({valueFrom}) => valueFrom === `./${internalsSubpath.slice('sanity/'.length)}`)
          .map(({name}) => name),
      )
      expect(privacyByFile.get(internalsDtsFile)?.size).toBeGreaterThan(0)
      expect(
        exportsOf(internalsDtsFile, false).filter((name) => !valuesOfPublicTypes.has(name)),
        `These exports are public API: export them from \`${entry}\` instead, or, when only ` +
          `the runtime value belongs here, export the type from \`${entry}\` with ` +
          '`export {type X}` and list it under "typeOnly" in ' +
          '`packages/sanity/src/_exports/tombstones/manifest.json`.',
      ).toEqual([])
    })
  }
})

/**
 * Every internals entry the package exports: the base entry, its numbered entries (`-1`, `-2`)
 * and the `-router` and `-structure` subpaths, read from its exports map so that a new one is
 * covered as soon as it is added.
 */
const INTERNALS_ENTRIES = Object.fromEntries(
  Object.keys(
    (
      JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../../sanity/package.json'), 'utf8'),
      ) as {exports: Record<string, unknown>}
    ).exports,
  )
    .filter((subpath) =>
      subpath.startsWith('./_dangerously_use_private_internals_that_do_not_follow_semver'),
    )
    .map((subpath) => [`sanity/${subpath.slice(2)}`, `${subpath.slice(2)}.d.ts`]),
)

const PUBLIC_TAGS = new Set(['public', 'beta', 'alpha'])

function publicTagsOf(declaration: ExportedDeclarations): string[] {
  const docs = Node.isVariableDeclaration(declaration)
    ? (declaration.getVariableStatement()?.getJsDocs() ?? [])
    : Node.isJSDocable(declaration)
      ? declaration.getJsDocs()
      : []
  return docs.flatMap((doc) =>
    doc
      .getTags()
      .map((tag) => tag.getTagName())
      .filter((tag) => PUBLIC_TAGS.has(tag)),
  )
}

/**
 * A public name is one people were told they can rely on, so it never lives on an internals
 * entry: export it from `sanity` or the public subpath it belongs to, or tag it `@internal`. The
 * only public declarations an internals entry may export are the runtime values of public types
 * that their entry only exports type-only, which the manifest lists under `typeOnly` with the
 * internals entry as `valueFrom` (the Structure Builder classes).
 */
describe('the internals entries export nothing tagged @public, @beta or @alpha', () => {
  test('covers every internals entry', () => {
    expect(Object.keys(INTERNALS_ENTRIES).length).toBeGreaterThanOrEqual(5)
  })

  const project = new Project({skipAddingFilesFromTsConfig: true})

  for (const [entry, dtsFile] of Object.entries(INTERNALS_ENTRIES)) {
    test(entry, {timeout: DTS_PARSE_TIMEOUT}, () => {
      const valuesOfPublicTypes = new Set(
        Object.values(manifest.typeOnly ?? {})
          .flat()
          .filter(({valueFrom}) => valueFrom === `./${entry.slice('sanity/'.length)}`)
          .map(({name}) => name),
      )
      const exported = project
        .addSourceFileAtPath(path.join(sanityLibDir, dtsFile))
        .getExportedDeclarations()
      expect(exported.size).toBeGreaterThan(0)
      const tagged: string[] = []
      for (const [name, declarations] of exported) {
        if (valuesOfPublicTypes.has(name) || declarations.every(isTombstoneDeclaration)) continue
        const tags = new Set(ownDeclarations(declarations).flatMap(publicTagsOf))
        if (tags.size > 0) tagged.push(`${name} (@${[...tags].join(', @')})`)
      }
      expect(
        tagged,
        `\`${entry}\` is for @internal declarations only. Export these from \`sanity\` or the ` +
          'public subpath they belong to (and remove their tombstone there), or tag them `@internal`.',
      ).toEqual([])
    })
  }
})
