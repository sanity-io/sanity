/**
 * Compares the export surface of the published `sanity@latest` with the workspace build, so
 * every export v7 removes or moves is either covered by a tombstone in
 * `packages/sanity/src/_exports/tombstones/manifest.json` or reported as a to-do.
 */
import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'

import {Node, Project} from 'ts-morph'

/** @typedef {'value' | 'type'} ExportKind */
/** @typedef {{kind: ExportKind, tombstone: boolean, deprecated: string | undefined}} ExportInfo */
/** @typedef {Record<string, Record<string, ExportInfo>>} Surface */
/** @typedef {{name: string, kind: ExportKind, message: string}} Tombstone */
/** @typedef {{removedEntries: string[], tombstones: Record<string, Tombstone[]>}} Manifest */

const require = createRequire(import.meta.url)

const PACKAGE_NAME = 'sanity'
export const WORKSPACE_PACKAGE_DIR = path.dirname(require.resolve(`${PACKAGE_NAME}/package.json`))
const MANIFEST_PATH = path.join(WORKSPACE_PACKAGE_DIR, 'src/_exports/tombstones/manifest.json')
const MANIFEST_REPO_PATH = 'packages/sanity/src/_exports/tombstones/manifest.json'

/**
 * Under the workspace package so the published `.d.ts` resolves `@sanity/client`, `react` and its
 * other imports to the same dependencies the workspace build sees.
 */
const CACHE_DIR = path.join(WORKSPACE_PACKAGE_DIR, 'node_modules/.cache/sanity-latest')

/** @returns {Manifest} */
export function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

/**
 * Downloads and unpacks the package that the npm `latest` tag points at, once per version.
 *
 * @param {string} [tag]
 * @returns {Promise<{version: string, packageDir: string}>}
 */
export async function fetchPublishedPackage(tag = 'latest') {
  const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/${tag}`)
  if (!response.ok) {
    throw new Error(`Could not read ${PACKAGE_NAME}@${tag} from npm: ${response.status}`)
  }
  /** @type {{version: string, dist: {tarball: string}}} */
  const manifest = await response.json()
  const versionDir = path.join(CACHE_DIR, manifest.version)
  const packageDir = path.join(versionDir, 'package')
  if (existsSync(path.join(packageDir, 'package.json'))) {
    return {version: manifest.version, packageDir}
  }

  const tarball = await fetch(manifest.dist.tarball)
  if (!tarball.ok) {
    throw new Error(`Could not download ${manifest.dist.tarball}: ${tarball.status}`)
  }
  const partialDir = `${versionDir}.partial`
  rmSync(partialDir, {recursive: true, force: true})
  mkdirSync(partialDir, {recursive: true})
  const tarballPath = path.join(partialDir, 'package.tgz')
  writeFileSync(tarballPath, Buffer.from(await tarball.arrayBuffer()))
  execFileSync('tar', ['-xzf', tarballPath, '-C', partialDir])
  rmSync(tarballPath)
  rmSync(versionDir, {recursive: true, force: true})
  renameSync(partialDir, versionDir)
  return {version: manifest.version, packageDir}
}

/**
 * The `.d.ts` of every entry in a package's `exports` map that carries code. Works on both the
 * workspace manifest (`{monorepo, default}` objects) and the published one (plain strings).
 *
 * @param {string} packageDir
 * @returns {Map<string, string>} subpath → absolute `.d.ts` path
 */
function listEntries(packageDir) {
  const {exports} = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
  /** @type {Map<string, string>} */
  const entries = new Map()
  for (const [subpath, value] of Object.entries(exports)) {
    if (subpath === './package.json' || subpath.endsWith('.css')) continue
    const target = typeof value === 'string' ? value : value?.default
    if (typeof target !== 'string' || !/\.(m|c)?js$/.test(target)) continue
    entries.set(subpath, path.join(packageDir, target.replace(/\.(m|c)?js$/, '.d.ts')))
  }
  return entries
}

/** @param {import('ts-morph').Symbol} symbol */
function resolveAlias(symbol) {
  let current = symbol
  for (let depth = 0; depth < 100 && current.isAlias(); depth++) {
    const next = current.getImmediatelyAliasedSymbol()
    if (!next) break
    current = next
  }
  return current
}

/**
 * `export declare const Name: never` or `export type Name = never`
 *
 * @param {import('ts-morph').Node} declaration
 */
export function isTombstoneDeclaration(declaration) {
  if (Node.isTypeAliasDeclaration(declaration)) {
    return declaration.getTypeNode()?.getText() === 'never'
  }
  if (!Node.isVariableDeclaration(declaration)) return false
  if (declaration.getTypeNode()?.getText() !== 'never') return false
  const statement = declaration.getFirstAncestor(Node.isVariableStatement)
  return Boolean(statement?.hasDeclareKeyword())
}

/** @param {import('ts-morph').Node} declaration */
function getDeprecatedMessage(declaration) {
  const host = Node.isVariableDeclaration(declaration)
    ? declaration.getFirstAncestor(Node.isVariableStatement)
    : declaration
  if (!host || !Node.isJSDocable(host)) return undefined
  for (const doc of host.getJsDocs()) {
    for (const tag of doc.getTags()) {
      if (tag.getTagName() === 'deprecated') {
        return tag.getCommentText()?.replace(/\s+/g, ' ').trim() ?? ''
      }
    }
  }
  return undefined
}

/** @param {import('ts-morph').Node} node */
function isTypeOnlyAlias(node) {
  if ((Node.isExportSpecifier(node) || Node.isImportSpecifier(node)) && node.isTypeOnly()) {
    return true
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

/** @type {WeakMap<import('ts-morph').SourceFile, Map<string, import('ts-morph').Symbol>>} */
const exportSymbolsCache = new WeakMap()

/** @param {import('ts-morph').SourceFile} sourceFile */
function getExportSymbolsByName(sourceFile) {
  let symbols = exportSymbolsCache.get(sourceFile)
  if (!symbols) {
    symbols = new Map(sourceFile.getExportSymbols().map((symbol) => [symbol.getName(), symbol]))
    exportSymbolsCache.set(sourceFile, symbols)
  }
  return symbols
}

/**
 * The kind a module exports a symbol as. A name that reaches the module only through
 * `export type * from` stars is a type, even when its declaration is a value, which is how an
 * entry keeps a value's type while dropping the value.
 *
 * @param {import('ts-morph').SourceFile} sourceFile
 * @param {import('ts-morph').Symbol} symbol
 * @param {number} [depth]
 * @returns {ExportKind}
 */
function getModuleExportKind(sourceFile, symbol, depth = 0) {
  const isLocal = symbol.getDeclarations().some((node) => node.getSourceFile() === sourceFile)
  if (isLocal || depth > 20) return getExportKind(symbol)
  /** @type {ExportKind | undefined} */
  let kind
  for (const declaration of sourceFile.getExportDeclarations()) {
    if (declaration.hasNamedExports() || declaration.getNamespaceExport()) continue
    const target = declaration.getModuleSpecifierSourceFile()
    const reexported = target && getExportSymbolsByName(target).get(symbol.getName())
    if (!reexported) continue
    if (
      !declaration.isTypeOnly() &&
      getModuleExportKind(target, reexported, depth + 1) === 'value'
    ) {
      return 'value'
    }
    kind = 'type'
  }
  return kind ?? getExportKind(symbol)
}

/**
 * Reads every exported name (values and types) of every entry of a built package.
 *
 * @param {string} packageDir
 * @returns {Surface}
 */
export function readSurface(packageDir) {
  const project = new Project({skipAddingFilesFromTsConfig: true})
  /** @type {Surface} */
  const surface = {}
  for (const [subpath, dtsFile] of listEntries(packageDir)) {
    const sourceFile = project.addSourceFileAtPath(dtsFile)
    /** @type {Record<string, ExportInfo>} */
    const names = {}
    for (const symbol of getExportSymbolsByName(sourceFile).values()) {
      const declarations = resolveAlias(symbol).getDeclarations()
      const tombstoneDeclaration = declarations.find(isTombstoneDeclaration)
      names[symbol.getName()] = {
        kind: getModuleExportKind(sourceFile, symbol),
        tombstone: Boolean(tombstoneDeclaration),
        deprecated: tombstoneDeclaration ? getDeprecatedMessage(tombstoneDeclaration) : undefined,
      }
    }
    surface[subpath] = names
  }
  return surface
}

/** @param {string} subpath */
export function entryImportPath(subpath) {
  return subpath === '.' ? PACKAGE_NAME : `${PACKAGE_NAME}/${subpath.slice(2)}`
}

/**
 * @typedef {object} MissingExport
 * @property {string} entry
 * @property {string} name
 * @property {ExportKind} kind what the published package exports the name as
 * @property {string[]} exportedFrom other workspace entries that export it as that kind
 * @property {boolean} [typeOnly] the entry still exports the name, but only as a type
 */

/**
 * @typedef {object} SurfaceDiff
 * @property {MissingExport[]} missing exports of the published package that the workspace
 *   neither exports (as the same kind) nor tombstones
 * @property {string[]} missingEntries entries of the published package that the workspace lacks
 *   and the manifest does not list under `removedEntries`
 * @property {{entry: string, name: string, reason: string}[]} stale manifest tombstones that
 *   have nothing left to cover
 * @property {{entry: string, name: string, kind: ExportKind, target: string, exportedFrom: string[]}[]} misdirected
 *   tombstones whose message says the name moved to an entry that does not export it
 * @property {string[]} staleRemovedEntries `removedEntries` that the workspace still exports or
 *   that the published package never had
 */

const MOVED_TO = /^Moved to `([^`]+)`/

/** @param {string} importPath */
function importPathToEntry(importPath) {
  if (importPath === PACKAGE_NAME) return '.'
  return importPath.startsWith(`${PACKAGE_NAME}/`)
    ? `./${importPath.slice(PACKAGE_NAME.length + 1)}`
    : undefined
}

/**
 * @param {{published: Surface, workspace: Surface, manifest: Manifest}} input
 * @returns {SurfaceDiff}
 */
export function diffSurfaces({published, workspace, manifest}) {
  /** @type {SurfaceDiff} */
  const diff = {
    missing: [],
    missingEntries: [],
    stale: [],
    misdirected: [],
    staleRemovedEntries: [],
  }
  const removedEntries = new Set(manifest.removedEntries)

  /** @type {Map<string, {entry: string, kind: ExportKind}[]>} name → its real workspace exports */
  const realExports = new Map()
  for (const [entry, names] of Object.entries(workspace)) {
    for (const [name, info] of Object.entries(names)) {
      if (info.tombstone) continue
      realExports.set(name, [...(realExports.get(name) ?? []), {entry, kind: info.kind}])
    }
  }
  /**
   * @param {string} name
   * @param {ExportKind} kind
   */
  const entriesExporting = (name, kind) =>
    (realExports.get(name) ?? [])
      .filter((other) => kind === 'type' || other.kind === 'value')
      .map((other) => other.entry)

  for (const [entry, names] of Object.entries(published)) {
    const provided = workspace[entry]
    if (!provided) {
      if (!removedEntries.has(entry)) diff.missingEntries.push(entry)
      continue
    }
    const tombstoned = new Set((manifest.tombstones[entry] ?? []).map((t) => t.name))
    for (const [name, info] of Object.entries(names)) {
      const current = provided[name]
      const typeOnly = Boolean(
        current && !current.tombstone && info.kind === 'value' && current.kind === 'type',
      )
      if (current && !current.tombstone && !typeOnly) continue
      if (tombstoned.has(name)) continue
      diff.missing.push({
        entry,
        name,
        kind: info.kind,
        exportedFrom: entriesExporting(name, info.kind).filter((other) => other !== entry),
        ...(typeOnly ? {typeOnly} : {}),
      })
    }
  }

  for (const entry of removedEntries) {
    if (workspace[entry]) diff.staleRemovedEntries.push(`${entry} (still exported)`)
    else if (!published[entry])
      diff.staleRemovedEntries.push(`${entry} (not in the published package)`)
  }

  for (const [entry, tombstones] of Object.entries(manifest.tombstones)) {
    for (const {name, kind, message} of tombstones) {
      const current = workspace[entry]?.[name]
      if (!workspace[entry]) {
        diff.stale.push({entry, name, reason: `the workspace has no ${entry} entry`})
        continue
      }
      if (current && !current.tombstone) {
        diff.stale.push({entry, name, reason: 'it is exported'})
        continue
      }
      if (!published[entry]?.[name]) {
        diff.stale.push({entry, name, reason: 'the published package never exported it'})
        continue
      }
      const importPath = MOVED_TO.exec(message)?.[1]
      const target = importPath && importPathToEntry(importPath)
      if (target && !entriesExporting(name, kind).includes(target)) {
        diff.misdirected.push({
          entry,
          name,
          kind,
          target,
          exportedFrom: entriesExporting(name, kind).filter((other) => other !== entry),
        })
      }
    }
  }

  diff.missing.sort((a, b) => a.entry.localeCompare(b.entry) || a.name.localeCompare(b.name))
  return diff
}

const REPLACEMENT_IMPORT =
  /((?:`[^`]+`(?:,? (?:and |or )?)?)+(?: hook)?) from (`[^`]+`|the same entry)/g

/**
 * Replacement imports a tombstone message names: `` `X` from `sanity/entry` ``, a list of
 * names (`` `X` and `Y` from … ``), or `` `X` from the same entry `` (the entry the message
 * named last). Imports from other packages (`@sanity/types`) are not checked.
 *
 * @param {string} message
 * @returns {{names: string[], importPath: string | undefined}[]} `importPath` is undefined when
 *   the message says "the same entry" without having named one
 */
export function parseReplacementImports(message) {
  /** @type {{names: string[], importPath: string | undefined}[]} */
  const imports = []
  /** @type {string | undefined} */
  let lastEntry
  for (const match of message.matchAll(REPLACEMENT_IMPORT)) {
    const names = [...match[1].matchAll(/`\{?([^`}]+)\}?`/g)].map((span) => span[1])
    const importPath = match[2] === 'the same entry' ? lastEntry : match[2].slice(1, -1)
    if (match[2] !== 'the same entry') {
      if (importPath !== PACKAGE_NAME && !importPath?.startsWith(`${PACKAGE_NAME}/`)) continue
      lastEntry = importPath
    }
    imports.push({names, importPath})
  }
  return imports
}

/**
 * Tombstone messages that tell a consumer to import a name from an entry that does not export
 * it, or from an entry the workspace does not have.
 *
 * @param {{workspace: Surface, manifest: Manifest}} input
 * @returns {{entry: string, name: string, replacement: string, importPath: string | undefined, reason: string}[]}
 */
export function findBrokenReplacementImports({workspace, manifest}) {
  /** @type {ReturnType<typeof findBrokenReplacementImports>} */
  const broken = []
  for (const [entry, tombstones] of Object.entries(manifest.tombstones)) {
    for (const {name, message} of tombstones) {
      for (const {names, importPath} of parseReplacementImports(message)) {
        const target = importPath && importPathToEntry(importPath)
        for (const replacement of names) {
          const reason = !target
            ? 'the message says "the same entry" but names no entry before it'
            : !workspace[target]
              ? `the workspace has no ${importPath} entry`
              : workspace[target][replacement]?.tombstone !== false
                ? `${importPath} does not export ${replacement}`
                : undefined
          if (reason) broken.push({entry, name, replacement, importPath, reason})
        }
      }
    }
  }
  return broken
}

const INTERNALS_ENTRY = './_dangerously_use_private_internals_that_do_not_follow_semver'

/**
 * The tombstone a missing export most likely needs, as a starting point for its manifest entry.
 *
 * @param {Pick<MissingExport, 'entry' | 'name' | 'kind' | 'exportedFrom'>} item
 * @returns {Tombstone}
 */
function suggestTombstone(item) {
  const target = item.exportedFrom[0]
  if (!target) {
    return {name: item.name, kind: item.kind, message: 'Removed in v7. <say what to use instead>'}
  }
  if (target === INTERNALS_ENTRY || target.startsWith(`${INTERNALS_ENTRY}/`)) {
    return {
      name: item.name,
      kind: item.kind,
      message: `Moved to \`${entryImportPath(target)}\`. This export is \`@internal\` and can change or disappear in any release.`,
    }
  }
  return {
    name: item.name,
    kind: item.kind,
    message: `Moved to \`${entryImportPath(target)}\`. Import \`{${item.name}}\` from \`${entryImportPath(target)}\` instead of \`${entryImportPath(item.entry)}\`.`,
  }
}

/**
 * One readable error message for everything the diff found, or `undefined` when it is clean.
 *
 * @param {SurfaceDiff} diff
 * @param {string} version the published version the workspace was compared with
 */
export function formatSurfaceDiff(diff, version) {
  const sections = []
  if (diff.missingEntries.length > 0) {
    sections.push(
      `${PACKAGE_NAME}@${version} has entries the workspace no longer exports. Add each one to ` +
        `"removedEntries" in ${MANIFEST_REPO_PATH} if the removal is intended:\n` +
        diff.missingEntries.map((entry) => `  - ${entryImportPath(entry)}`).join('\n'),
    )
  }
  if (diff.missing.length > 0) {
    const lines = diff.missing.map((item) => {
      const where = item.exportedFrom.length
        ? `now exported from ${item.exportedFrom.map(entryImportPath).join(', ')}`
        : `not exported${item.kind === 'value' ? ' as a value' : ''} from any other entry`
      const typeOnly = item.typeOnly ? ' (the entry still exports its type)' : ''
      return `  - ${item.name} (${item.kind}) from ${entryImportPath(item.entry)}${typeOnly}: ${where}. Add to "tombstones"["${item.entry}"]: ${JSON.stringify(suggestTombstone(item))}`
    })
    sections.push(
      `${PACKAGE_NAME}@${version} exports names the workspace removed or moved without a ` +
        `tombstone. Add a tombstone for each to ${MANIFEST_REPO_PATH} (write a message that names ` +
        'the replacement by its public import path), run ' +
        '`node packages/sanity/src/_exports/tombstones/generate.mjs` and rebuild:\n' +
        lines.join('\n'),
    )
  }
  if (diff.stale.length > 0) {
    sections.push(
      `These tombstones in ${MANIFEST_REPO_PATH} cover nothing. Remove them and run ` +
        '`node packages/sanity/src/_exports/tombstones/generate.mjs`:\n' +
        diff.stale
          .map((item) => `  - ${item.name} in ${entryImportPath(item.entry)}: ${item.reason}`)
          .join('\n'),
    )
  }
  if (diff.misdirected.length > 0) {
    sections.push(
      `These tombstones in ${MANIFEST_REPO_PATH} say the name moved to an entry that does not ` +
        'export it. Point the message at the entry that does and run ' +
        '`node packages/sanity/src/_exports/tombstones/generate.mjs`:\n' +
        diff.misdirected
          .map((item) => {
            const where = item.exportedFrom.length
              ? `exported from ${item.exportedFrom.map(entryImportPath).join(', ')}`
              : 'not exported from any other entry'
            const suggestion = item.exportedFrom.length
              ? ` Suggested: ${JSON.stringify(suggestTombstone(item).message)}`
              : ''
            return `  - ${item.name} in ${entryImportPath(item.entry)} points at ${entryImportPath(item.target)}, but it is ${where}.${suggestion}`
          })
          .join('\n'),
    )
  }
  if (diff.staleRemovedEntries.length > 0) {
    sections.push(
      `These "removedEntries" in ${MANIFEST_REPO_PATH} are wrong. Remove them:\n` +
        diff.staleRemovedEntries.map((entry) => `  - ${entry}`).join('\n'),
    )
  }
  return sections.length > 0 ? sections.join('\n\n') : undefined
}
