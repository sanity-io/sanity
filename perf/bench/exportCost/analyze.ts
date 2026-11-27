import * as fs from 'node:fs'
import path from 'node:path'

import {parseSync} from 'oxc-parser'

import {type CdnBuild} from './cdnBuild'
import {BindingGraph, type Resolved} from './graph'
import {type ReleaseTag, ReleaseTags} from './releaseTags'
import {type ByteSizes, ModuleSizes} from './sizes'
import {type StepName} from './steps'

/** What one step of a visit loads from the module CDN. */
export interface StepScope {
  /** CDN entries requested (`index`, `structure`, …). */
  entries: string[]
  /** Lazily loaded chunks requested (file names). */
  lazyChunks: string[]
}

export interface StepCost {
  /** Bytes the step stops loading if only this export leaves its entry. */
  exclusive: ByteSizes
  exclusiveModules: number
  /**
   * The part of `exclusive` that nothing else in the whole build reaches (no other export of any
   * entry, no entry side effect, no lazy import), so it leaves the bundle with the export. The
   * rest stays in the build for an entry or lazy chunk the step does not load, and whether the
   * step still loads it depends on which chunk rolldown co-locates it in.
   */
  leavesBuild: ByteSizes
  /** Minified bytes of the rest of its static closure, which the step needs anyway. */
  sharedMinified: number
  /** The step's own code (the studio, lazy chunks, entry side effects) reaches the export. */
  used: boolean
}

export interface ExportCost {
  entry: string
  name: string
  tag: ReleaseTag
  /** Declaring module, relative to the repository. */
  declaredIn: string
  /** Another CDN entry or the studio imports it by specifier, so it cannot simply disappear. */
  importedViaImportMap: boolean
  steps: Partial<Record<StepName, StepCost>>
}

export interface Analysis {
  sizes: ModuleSizes
  entryExports: Record<string, string[]>
  costs: ExportCost[]
}

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

/** Maps an import-map specifier (`sanity`, `sanity/structure`) to its CDN entry name. */
export function entryForSpecifier(
  specifier: string,
  entries: Record<string, string>,
): string | undefined {
  if (specifier === 'sanity') return 'index'
  if (!specifier.startsWith('sanity/')) return undefined
  const sub = specifier.slice('sanity/'.length)
  return sub in entries ? sub : undefined
}

/** What the studio build's own JS imports from `sanity` entries: specifier → names. */
export function studioImports(studioDir: string): Map<string, Set<string>> {
  const imports = new Map<string, Set<string>>()
  const staticDir = path.join(studioDir, 'static')
  for (const file of fs.readdirSync(staticDir)) {
    if (!file.endsWith('.js')) continue
    const code = fs.readFileSync(path.join(staticDir, file), 'utf8')
    const {module} = parseSync(file, code, {lang: 'js', sourceType: 'module'})
    for (const statement of module.staticImports) {
      const specifier = statement.moduleRequest.value
      if (specifier !== 'sanity' && !specifier.startsWith('sanity/')) continue
      const names = imports.get(specifier) ?? new Set<string>()
      for (const entry of statement.entries) {
        const kind: string = entry.importName.kind
        names.add(
          kind === 'NamespaceObject'
            ? '*'
            : kind === 'Default'
              ? 'default'
              : entry.importName.name!,
        )
      }
      imports.set(specifier, names)
    }
  }
  return imports
}

interface StepState {
  entries: Set<string>
  /** Modules the step loads whatever its entries export. */
  fixed: Set<string>
  /** Modules the step's own code needs, following imports across entries. */
  needed: Set<string>
  /** How many exports of the step's entries reach each module. */
  reach: Map<string, number>
}

/**
 * The cost of each runtime export of the CDN entries in `scopes`, per step: the modules that
 * only that export reaches among everything the step loads (the other exports of the step's
 * entries, the entries' side-effect imports, and the lazy chunks the step requested), and
 * whether the step's own code uses it.
 */
export async function analyze(options: {
  cdn: CdnBuild
  scopes: Partial<Record<StepName, StepScope>>
  studioImports: Map<string, Set<string>>
}): Promise<Analysis> {
  const {cdn, scopes} = options
  const graph = new BindingGraph(cdn.modules)
  const sizes = await ModuleSizes.fromBuild(cdn)
  const tags = new ReleaseTags()

  const entryExports: Record<string, string[]> = {}
  for (const chunk of cdn.chunks) {
    if (!chunk.isEntry || !chunk.facadeModuleId) continue
    const entry = Object.entries(cdn.entries).find(([, id]) => id === chunk.facadeModuleId)?.[0]
    if (entry) entryExports[entry] = chunk.exports.filter((name) => name !== '__esModule')
  }

  const exportRoots = (entry: string, names: Iterable<string>): Resolved[] => {
    const entryId = cdn.entries[entry]
    if (!entryId) return []
    const roots: Resolved[] = []
    for (const name of names) {
      for (const each of name === '*' ? (entryExports[entry] ?? []) : [name]) {
        roots.push(...graph.definingModules(entryId, each))
      }
    }
    return roots
  }
  const followExternal = (specifier: string, names: string[]): Resolved[] => {
    const entry = entryForSpecifier(specifier, cdn.entries)
    return entry ? exportRoots(entry, names) : []
  }

  const closures = new Map<string, Set<string>>()
  const definitions = new Map<string, Resolved[]>()
  for (const [entry, names] of Object.entries(entryExports)) {
    for (const name of names) {
      const roots = exportRoots(entry, [name])
      definitions.set(`${entry}\0${name}`, roots)
      closures.set(`${entry}\0${name}`, graph.closure(roots))
    }
  }

  const importedViaImportMap = new Set<string>()
  const markImported = (specifier: string, names: Iterable<string>) => {
    const entry = entryForSpecifier(specifier, cdn.entries)
    if (!entry) return
    for (const name of names) {
      for (const each of name === '*' ? (entryExports[entry] ?? []) : [name]) {
        importedViaImportMap.add(`${entry}\0${each}`)
      }
    }
  }
  for (const id of graph.moduleIds()) {
    for (const {specifier, names} of graph.externalImports(id)) markImported(specifier, names)
  }
  for (const [specifier, names] of options.studioImports) markImported(specifier, names)

  const chunkOf = new Map<string, string>()
  for (const chunk of cdn.chunks) {
    for (const id of Object.keys(chunk.modules)) chunkOf.set(id, chunk.fileName)
  }
  const globalReach = new Map<string, number>()
  for (const closure of closures.values()) {
    for (const id of closure) globalReach.set(id, (globalReach.get(id) ?? 0) + 1)
  }
  const globalFixed = graph.closure([
    ...Object.values(cdn.entries).flatMap((id) => graph.dependencies(id)),
    ...[...graph.moduleIds()].flatMap((id) =>
      (cdn.modules.get(id)?.dynamicallyImportedIds ?? []).flatMap((target) =>
        graph.wholeModule(target),
      ),
    ),
  ])

  const states = new Map<StepName, StepState>()
  for (const [step, scope] of Object.entries(scopes) as [StepName, StepScope][]) {
    const entries = new Set(scope.entries.filter((entry) => entry in entryExports))
    // A lazy import counts as loaded when the chunk rolldown put its target in was requested,
    // which may be an entry chunk (the internals entry serves the structure tool's lazy panes)
    const loaded = new Set([...scope.entries.map((entry) => `${entry}.mjs`), ...scope.lazyChunks])
    const lazyRoots: Resolved[] = []
    for (const id of graph.moduleIds()) {
      for (const target of cdn.modules.get(id)?.dynamicallyImportedIds ?? []) {
        const file = chunkOf.get(target)
        const from = chunkOf.get(id)
        if (file && from && loaded.has(file) && loaded.has(from)) {
          lazyRoots.push(...graph.wholeModule(target))
        }
      }
    }
    const baseRoots: Resolved[] = [...entries].flatMap((entry) =>
      graph.dependencies(cdn.entries[entry]!),
    )
    const fixed = graph.closure([...baseRoots, ...lazyRoots])
    const studioRoots: Resolved[] = []
    for (const [specifier, names] of options.studioImports) {
      studioRoots.push(...followExternal(specifier, [...names]))
    }
    const needed = graph.closure([...baseRoots, ...lazyRoots, ...studioRoots], followExternal)
    const reach = new Map<string, number>()
    for (const entry of entries) {
      for (const name of entryExports[entry]!) {
        for (const id of closures.get(`${entry}\0${name}`)!) reach.set(id, (reach.get(id) ?? 0) + 1)
      }
    }
    states.set(step, {entries, fixed, needed, reach})
  }

  const costs: ExportCost[] = []
  for (const [key, closure] of closures) {
    const [entry, name] = key.split('\0') as [string, string]
    const declaration = graph.declaration(cdn.entries[entry]!, name)
    const roots = definitions.get(key) ?? []
    const cost: ExportCost = {
      entry,
      name,
      tag: declaration ? tags.tag(declaration.id, declaration.local) : 'none',
      declaredIn: declaration ? path.relative(REPO_ROOT, declaration.id) : '',
      importedViaImportMap: importedViaImportMap.has(key),
      steps: {},
    }
    for (const [step, state] of states) {
      if (!state.entries.has(entry)) continue
      const exclusive: string[] = []
      const shared: string[] = []
      for (const id of closure) {
        if (state.fixed.has(id)) continue
        if (state.reach.get(id) === 1) exclusive.push(id)
        else shared.push(id)
      }
      const leavesBuild = exclusive.filter(
        (id) => globalReach.get(id) === 1 && !globalFixed.has(id),
      )
      cost.steps[step] = {
        exclusive: sizes.measure(exclusive, {compress: exclusive.length > 0}),
        exclusiveModules: exclusive.length,
        leavesBuild: sizes.measure(leavesBuild, {compress: leavesBuild.length > 0}),
        sharedMinified: sizes.minifiedBytes(shared),
        used: roots.some((root) => root.kind === 'module' && state.needed.has(root.id)),
      }
    }
    if (Object.keys(cost.steps).length > 0) costs.push(cost)
  }
  return {sizes, entryExports, costs}
}
