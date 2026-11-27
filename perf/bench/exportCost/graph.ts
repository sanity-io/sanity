import path from 'node:path'

import {parseSync} from 'oxc-parser'

import {type CapturedModule} from './cdnBuild'

/** Where an export of a module comes from. */
type ExportTarget =
  | {kind: 'local'; local: string}
  | {kind: 'reexport'; source: string; importName: string}
  | {kind: 'namespace'; source: string}

interface ImportBinding {
  source: string
  /** `default`, a named export, or `*` for a namespace import. */
  importName: string
}

interface ParsedModule {
  id: string
  esm: boolean
  exports: Map<string, ExportTarget>
  starExports: string[]
  /** Imports the module's own code uses (re-exports excluded). */
  imports: ImportBinding[]
}

/** A module id inside the graph, or an external specifier (`sanity/structure`). */
export type Resolved = {kind: 'module'; id: string} | {kind: 'external'; specifier: string}

/**
 * The module graph of one CDN build at the level of bindings: an import of `a` from a barrel
 * reaches the module that declares `a`, not the barrel and everything else it re-exports. That
 * is what rolldown's tree-shaking keeps, minus code it proves unused inside a module.
 */
export class BindingGraph {
  readonly #modules = new Map<string, ParsedModule>()
  readonly #captured: Map<string, CapturedModule>

  constructor(captured: Map<string, CapturedModule>) {
    this.#captured = captured
    for (const module of captured.values()) {
      this.#modules.set(module.id, parseModule(module))
    }
  }

  moduleIds(): IterableIterator<string> {
    return this.#modules.keys()
  }

  resolve(importer: string, source: string): Resolved | undefined {
    const resolved = this.#captured.get(importer)?.resolved[source]
    // Rolldown settles the `external` option before any resolveId hook runs, so the capture
    // never sees those imports (react, `sanity/*`)
    if (!resolved) {
      return source.startsWith('.') || path.isAbsolute(source)
        ? undefined
        : {kind: 'external', specifier: source}
    }
    if (resolved.startsWith('external:')) {
      return {kind: 'external', specifier: resolved.slice('external:'.length)}
    }
    return {kind: 'module', id: resolved}
  }

  /** Runtime names a module exports, following `export *`. */
  exportNames(id: string, seen = new Set<string>()): Set<string> {
    const names = new Set<string>()
    const module = this.#modules.get(id)
    if (!module || seen.has(id)) return names
    seen.add(id)
    for (const name of module.exports.keys()) names.add(name)
    for (const source of module.starExports) {
      const target = this.resolve(id, source)
      if (target?.kind !== 'module') continue
      for (const name of this.exportNames(target.id, seen)) {
        if (name !== 'default') names.add(name)
      }
    }
    return names
  }

  /**
   * The modules whose code defines `name` as exported by `id`. A namespace re-export defines
   * every export of its target, and an external target is returned as such.
   */
  definingModules(id: string, name: string, seen = new Set<string>()): Resolved[] {
    const key = `${id}\0${name}`
    if (seen.has(key)) return []
    seen.add(key)
    const module = this.#modules.get(id)
    if (!module || !module.esm) return [{kind: 'module', id}]
    // A namespace import keeps every export. A named import follows only that binding, which is
    // what rolldown tree-shakes a barrel down to.
    if (name === '*') return this.#namespace(id, seen)

    const target = module.exports.get(name)
    if (target) {
      if (target.kind === 'local') return [{kind: 'module', id}]
      const resolved = this.resolve(id, target.source)
      if (!resolved) return []
      if (resolved.kind === 'external') return [resolved]
      if (target.kind === 'namespace') return this.#namespace(resolved.id, seen)
      return this.definingModules(resolved.id, target.importName, seen)
    }
    if (name === 'default') return []
    for (const source of module.starExports) {
      const resolved = this.resolve(id, source)
      if (resolved?.kind !== 'module') continue
      if (!this.exportNames(resolved.id).has(name)) continue
      return this.definingModules(resolved.id, name, seen)
    }
    return []
  }

  /** The module and local name that declare `name` as exported by `id`, following renames. */
  declaration(id: string, name: string, depth = 0): {id: string; local: string} | undefined {
    const module = this.#modules.get(id)
    if (!module || depth > 64) return undefined
    const target = module.exports.get(name)
    if (target?.kind === 'local') return {id, local: target.local}
    if (target?.kind === 'reexport') {
      const resolved = this.resolve(id, target.source)
      return resolved?.kind === 'module'
        ? this.declaration(resolved.id, target.importName, depth + 1)
        : undefined
    }
    if (target) return undefined
    for (const source of module.starExports) {
      const resolved = this.resolve(id, source)
      if (resolved?.kind === 'module' && this.exportNames(resolved.id).has(name)) {
        return this.declaration(resolved.id, name, depth + 1)
      }
    }
    return undefined
  }

  /** What loading a module as a whole (a lazy import's target) defines: it and its re-exports. */
  wholeModule(id: string): Resolved[] {
    return this.#namespace(id, new Set())
  }

  #namespace(id: string, seen: Set<string>): Resolved[] {
    const out: Resolved[] = [{kind: 'module', id}]
    for (const name of this.exportNames(id)) out.push(...this.definingModules(id, name, seen))
    return out
  }

  /** What including a module's code pulls in: its own imports, resolved to defining modules. */
  dependencies(id: string): Resolved[] {
    const module = this.#modules.get(id)
    const captured = this.#captured.get(id)
    if (!module || !captured) return []
    if (!module.esm) {
      return captured.importedIds.map((dep) =>
        this.#modules.has(dep)
          ? {kind: 'module', id: dep}
          : {kind: 'external', specifier: dep.replace(/^external:/, '')},
      )
    }
    const out: Resolved[] = []
    for (const binding of module.imports) {
      const resolved = this.resolve(id, binding.source)
      if (!resolved) continue
      if (resolved.kind === 'external' || binding.importName === '') {
        out.push(resolved)
        continue
      }
      out.push(...this.definingModules(resolved.id, binding.importName))
    }
    return out
  }

  /** Imports of external specifiers, with the names imported (`*` for namespaces). */
  externalImports(id: string): {specifier: string; names: string[]}[] {
    const module = this.#modules.get(id)
    if (!module) return []
    const bySpecifier = new Map<string, string[]>()
    for (const binding of module.imports) {
      const resolved = this.resolve(id, binding.source)
      if (resolved?.kind !== 'external') continue
      const names = bySpecifier.get(resolved.specifier) ?? []
      if (binding.importName) names.push(binding.importName)
      bySpecifier.set(resolved.specifier, names)
    }
    return [...bySpecifier].map(([specifier, names]) => ({specifier, names}))
  }

  /**
   * The modules reachable from `roots` through static imports. `onExternal` decides whether an
   * import of an external specifier (another CDN entry, through the import map) is followed, and
   * returns the roots it stands for.
   */
  closure(
    roots: Iterable<Resolved>,
    onExternal?: (specifier: string, names: string[]) => Resolved[],
  ): Set<string> {
    const seen = new Set<string>()
    const queue: string[] = []
    const visit = (resolved: Resolved, names: string[] = ['*']) => {
      if (resolved.kind === 'module') {
        if (!seen.has(resolved.id)) {
          seen.add(resolved.id)
          queue.push(resolved.id)
        }
        return
      }
      if (onExternal) for (const next of onExternal(resolved.specifier, names)) visit(next)
    }
    for (const root of roots) visit(root)
    while (queue.length > 0) {
      const id = queue.pop()!
      const externals = onExternal ? this.externalImports(id) : []
      for (const dep of this.dependencies(id)) {
        if (dep.kind === 'external') {
          const names = externals.find((entry) => entry.specifier === dep.specifier)?.names
          visit(dep, names && names.length > 0 ? names : ['*'])
        } else {
          visit(dep)
        }
      }
    }
    return seen
  }

  /** The modules an entry runs no matter which export is used (stylesheets, augmentations). */
  entryBase(entryId: string): Set<string> {
    return this.closure(this.dependencies(entryId))
  }
}

function parseModule(module: CapturedModule): ParsedModule {
  const parsed: ParsedModule = {
    id: module.id,
    esm: false,
    exports: new Map(),
    starExports: [],
    imports: [],
  }
  if (module.code === null) return parsed
  const {module: esm, errors} = parseSync(`${module.id.replace(/\?.*$/, '')}.js`, module.code, {
    lang: 'js',
    sourceType: 'module',
  })
  if (errors.length > 0 && esm.staticImports.length === 0 && esm.staticExports.length === 0) {
    return parsed
  }
  parsed.esm = esm.hasModuleSyntax

  for (const statement of esm.staticImports) {
    const source = statement.moduleRequest.value
    if (statement.entries.length === 0) {
      parsed.imports.push({source, importName: ''})
      continue
    }
    for (const entry of statement.entries) {
      if (entry.isType) continue
      const kind: string = entry.importName.kind
      parsed.imports.push({
        source,
        importName:
          kind === 'NamespaceObject'
            ? '*'
            : kind === 'Default'
              ? 'default'
              : entry.importName.name!,
      })
    }
  }

  for (const statement of esm.staticExports) {
    for (const entry of statement.entries) {
      if (entry.isType) continue
      const importKind: string = entry.importName.kind
      const exportKind: string = entry.exportName.kind
      const exportName = exportKind === 'Default' ? 'default' : entry.exportName.name
      const source = entry.moduleRequest?.value
      if (!source) {
        if (exportName) {
          parsed.exports.set(exportName, {kind: 'local', local: entry.localName.name ?? exportName})
        }
        continue
      }
      if (importKind === 'AllButDefault') {
        parsed.starExports.push(source)
      } else if (importKind === 'All') {
        if (exportName) parsed.exports.set(exportName, {kind: 'namespace', source})
      } else if (exportName) {
        parsed.exports.set(exportName, {
          kind: 'reexport',
          source,
          importName: entry.importName.name ?? 'default',
        })
      }
    }
  }
  return parsed
}
