/**
 * The v7 export map: every name a plugin can import from each published entry of Studio v7
 * (the `next-major` branch), and whether it is a runtime value or only a type.
 *
 * `v7-export-map.json` is the same file on `main` and `next-major`, and so is this module. Together
 * they let one plugin version support both majors: whatever a plugin imports from a v7 entry must
 * also work from that entry on v6, so when v7 moves an export to another entry (`sanity/i18n`, the
 * internals entry, …) the new path is backported to v6 next to the old one.
 *
 * - On `next-major`, the built packages must export exactly what the map lists, so moving or adding
 *   an export fails until the map is regenerated (`pnpm generate:v7-export-map`), and the map must
 *   not list anything `main`'s copy lacks, so it fails until the backport has landed on `main`.
 * - On `main`, the built packages must export everything the map lists, at the same entry, values
 *   as values (checked against the `.d.ts` here and at runtime in `@repo/test-exports`).
 */
import {createRequire} from 'node:module'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {Node, Project} from 'ts-morph'

/** @typedef {'value' | 'type'} ExportKind */
/** @typedef {Record<string, Record<string, ExportKind>>} ExportMap */

const require = createRequire(import.meta.url)

export const V7_EXPORT_MAP_PATH = fileURLToPath(new URL('./v7-export-map.json', import.meta.url))

/** Path of the map relative to the repository root, for reading it from another git ref */
export const V7_EXPORT_MAP_REPO_PATH =
  'packages/@repo/test-dts-exports/v7-export-map/v7-export-map.json'

const INTERNALS_ENTRY = './_dangerously_use_private_internals_that_do_not_follow_semver'

/**
 * Entries plugins import from: the public entries, the internals entry and its subpaths
 * (`…/structure`, `…/router`, `…/presentation`). Other `_`-prefixed entries are wiring between
 * Sanity's own packages, and stylesheets carry no exports.
 *
 * @param {string} subpath - the key in the package.json `exports` map
 */
function isPluginFacingEntry(subpath) {
  if (subpath === './package.json' || subpath.endsWith('.css')) return false
  return (
    subpath === INTERNALS_ENTRY ||
    subpath.startsWith(`${INTERNALS_ENTRY}/`) ||
    !subpath.startsWith('./_')
  )
}

/**
 * Exports of features that only exist on v7, so `main` has no implementation to re-export. They
 * are not moved exports, and a plugin that uses them only supports v7 anyway. Keyed by entry.
 *
 * @type {Record<string, ReadonlySet<string>>}
 */
const V7_ONLY_EXPORTS = {
  '@sanity/vision': new Set(['VisionAiConfig', 'VisionAiFeatures']),
}

/**
 * v7 keeps removed/moved names as `@deprecated` `never` tombstones in the `.d.ts` so TypeScript
 * can name the replacement. They must not appear in this map: the map is the dual-support
 * contract of real exports, and tombstones have no runtime value for `@repo/test-exports` to
 * import.
 *
 * Entry barrels re-export tombstones through rolldown-plugin-dts mangled aliases (`Event` →
 * `Event$1`, short names in the chunk), so walk aliases to the underlying declaration the same
 * way `getExportKind` does.
 *
 * @param {import('ts-morph').Symbol} symbol
 */
function isTombstoneExport(symbol) {
  let current = symbol
  for (let depth = 0; depth < 100 && current.isAlias(); depth++) {
    const next = current.getImmediatelyAliasedSymbol()
    if (!next) break
    current = next
  }
  return current.getDeclarations().some((declaration) => {
    if (Node.isTypeAliasDeclaration(declaration)) {
      return declaration.getTypeNode()?.getText() === 'never'
    }
    if (!Node.isVariableDeclaration(declaration)) return false
    if (declaration.getTypeNode()?.getText() !== 'never') return false
    const statement = declaration.getFirstAncestor(Node.isVariableStatement)
    return Boolean(statement?.hasDeclareKeyword())
  })
}

/** @param {import('ts-morph').Node} node */
function isTypeOnlyAlias(node) {
  if (Node.isExportSpecifier(node) || Node.isImportSpecifier(node)) {
    if (node.isTypeOnly()) return true
  }
  const declaration = node.getFirstAncestor(
    (ancestor) => Node.isExportDeclaration(ancestor) || Node.isImportDeclaration(ancestor),
  )
  return (
    (Node.isExportDeclaration(declaration) || Node.isImportDeclaration(declaration)) &&
    declaration.isTypeOnly()
  )
}

/**
 * A class exported with `export type {…}` is only a type to consumers, so every alias between the
 * entry and the declaration has to be a value alias.
 *
 * @param {import('ts-morph').Symbol} symbol
 * @returns {ExportKind}
 */
function getExportKind(symbol) {
  let current = symbol
  for (let depth = 0; depth < 100 && current.isAlias(); depth++) {
    if (current.getDeclarations().some(isTypeOnlyAlias)) return 'type'
    const next = current.getImmediatelyAliasedSymbol()
    if (!next) break
    current = next
  }
  return current
    .getDeclarations()
    .some(
      (declaration) =>
        Node.isVariableDeclaration(declaration) ||
        Node.isFunctionDeclaration(declaration) ||
        Node.isClassDeclaration(declaration) ||
        Node.isEnumDeclaration(declaration),
    )
    ? 'value'
    : 'type'
}

/**
 * A name an `export * from` / `export type * from` declaration provides resolves straight to its
 * declaration, with no alias that `getExportKind` could find `type` on. It is only a type when
 * every star export that provides it is type-only (`export type * from '@sanity/types'`).
 *
 * @param {import('ts-morph').SourceFile} sourceFile
 * @param {import('ts-morph').Symbol} symbol
 */
function isOnlyTypeStarExport(sourceFile, symbol) {
  if (symbol.isAlias()) return false
  const providers = sourceFile
    .getExportDeclarations()
    .filter((declaration) => !declaration.hasNamedExports() && !declaration.getNamespaceExport())
    .filter((declaration) =>
      declaration
        .getModuleSpecifierSourceFile()
        ?.getExportSymbols()
        .some((exported) => exported.getName() === symbol.getName()),
    )
  return providers.length > 0 && providers.every((declaration) => declaration.isTypeOnly())
}

/**
 * Reads the export map of the built packages (their `lib/**\/*.d.ts`), so run a build first.
 *
 * @returns {ExportMap}
 */
export function readExportMap() {
  const {dependencies} = require('../package.json')
  const project = new Project({skipAddingFilesFromTsConfig: true})
  /** @type {ExportMap} */
  const map = {}
  for (const packageName of Object.keys(dependencies).toSorted()) {
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const {exports} = require(packageJsonPath)
    if (!exports) continue
    for (const [subpath, value] of Object.entries(exports)) {
      if (!isPluginFacingEntry(subpath)) continue
      if (typeof value !== 'object' || value === null || typeof value.default !== 'string') continue
      const dtsFile = path.join(
        path.dirname(packageJsonPath),
        value.default.replace(/\.(m|c)?js$/, '.d.ts'),
      )
      const sourceFile = project.addSourceFileAtPath(dtsFile)
      const entry = path.posix.join(packageName, subpath)
      /** @type {Record<string, ExportKind>} */
      const names = {}
      const exported = sourceFile
        .getExportSymbols()
        .toSorted((a, b) => (a.getName() < b.getName() ? -1 : a.getName() > b.getName() ? 1 : 0))
      for (const symbol of exported) {
        if (isTombstoneExport(symbol)) continue
        if (V7_ONLY_EXPORTS[entry]?.has(symbol.getName())) continue
        names[symbol.getName()] = isOnlyTypeStarExport(sourceFile, symbol)
          ? 'type'
          : getExportKind(symbol)
      }
      map[entry] = names
    }
  }
  return map
}

/**
 * Lists every export of `required` that `actual` does not provide at the same entry: a missing
 * entry, a missing name, or a name that is only a type where `required` has a runtime value.
 *
 * @param {Record<string, Record<string, string>>} required - JSON imports type the kinds as `string`
 * @param {ExportMap} actual
 * @returns {string[]}
 */
export function findMissingExports(required, actual) {
  const missing = []
  for (const [entry, names] of Object.entries(required)) {
    const provided = actual[entry]
    if (!provided) {
      missing.push(`${entry} (the whole entry)`)
      continue
    }
    for (const [name, kind] of Object.entries(names)) {
      if (!(name in provided)) missing.push(`${entry}: ${name} (${kind})`)
      else if (kind === 'value' && provided[name] !== 'value') {
        missing.push(`${entry}: ${name} (value, exported only as a type)`)
      }
    }
  }
  return missing
}
