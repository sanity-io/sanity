import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'
import process from 'node:process'

import {build, type Plugin} from 'vite'

/** The `sanity` package, whose `package.bundle.ts` builds the bundle auto-updating studios load. */
export const SANITY_PACKAGE = path.resolve(import.meta.dirname, '../../../packages/sanity')

/** One module of the build, as rolldown saw it after every transform. */
export interface CapturedModule {
  id: string
  /** The transformed code (JS, types stripped). Null for externals. */
  code: string | null
  /** Import specifier → resolved module id, or `external:<id>` for externals. */
  resolved: Record<string, string>
  /** Resolved ids of the static imports, for modules without ESM syntax (CommonJS). */
  importedIds: string[]
  dynamicallyImportedIds: string[]
}

export interface CapturedChunk {
  fileName: string
  name: string
  isEntry: boolean
  isDynamicEntry: boolean
  facadeModuleId: string | null
  /** Static imports: chunk file names, or bare specifiers for externals. */
  imports: string[]
  dynamicImports: string[]
  exports: string[]
  /** Rendered (tree-shaken, not yet minified) code per module in this chunk. */
  modules: Record<string, {renderedLength: number; code: string | null}>
  /** The minified chunk as written to disk. */
  code: string
}

export interface CdnBuild {
  outDir: string
  /** Entry name (`index`, `router`, …) → the entry module's id. */
  entries: Record<string, string>
  chunks: CapturedChunk[]
  modules: Map<string, CapturedModule>
}

/** Keep `except` out of an entry: rebuild it as a module that re-exports everything else. */
export interface EntryOverride {
  entry: string
  except: string[]
  /** Every runtime export of the original entry. */
  exports: string[]
}

/**
 * Stand-in module for one CDN entry during a verification rebuild.
 * Entry names follow the bundle keys, and some contain slashes
 * (`_dangerously_use_private_internals_that_do_not_follow_semver/structure`).
 */
export function overrideModulePath(overrideDir: string, entry: string): string {
  const file = path.join(overrideDir, `${entry}.ts`)
  fs.mkdirSync(path.dirname(file), {recursive: true})
  return file
}

/**
 * Build the CDN bundle (`packages/sanity/package.bundle.ts`, what `autoUpdates: true` studios
 * load through the module CDN) into `outDir`, and capture its module graph: every module's
 * transformed code and resolved imports, and which modules each output chunk renders.
 *
 * With `overrides`, each listed entry is replaced by a generated module that re-exports every
 * runtime export of the original entry except the given names, so rolldown tree-shakes them the way it
 * would if they had moved to another entry point.
 */
export async function buildCdnBundle(options: {
  outDir: string
  overrides?: EntryOverride[]
}): Promise<CdnBuild> {
  const {outDir, overrides = []} = options
  const modules = new Map<string, CapturedModule>()
  const resolutions = new Map<string, Record<string, string>>()
  const chunks: CapturedChunk[] = []
  let entries: Record<string, string> = {}

  const capture: Plugin = {
    name: 'bench/export-cost-capture',
    enforce: 'post',
    configResolved(config) {
      const entry = config.build.lib ? config.build.lib.entry : undefined
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        entries = Object.fromEntries(
          Object.entries(entry).map(([name, file]) => [name, path.resolve(config.root, file)]),
        )
      }
    },
    resolveId: {
      order: 'pre',
      async handler(source, importer, resolveOptions) {
        if (!importer) return null
        const resolved = await this.resolve(source, importer, {...resolveOptions, skipSelf: true})
        if (resolved) {
          let map = resolutions.get(importer)
          if (!map) resolutions.set(importer, (map = {}))
          map[source] = resolved.external ? `external:${resolved.id}` : resolved.id
        }
        return null
      },
    },
    generateBundle(_outputOptions, bundle) {
      for (const id of this.getModuleIds()) {
        const info = this.getModuleInfo(id)
        if (!info) continue
        modules.set(id, {
          id,
          code: info.code,
          resolved: resolutions.get(id) ?? {},
          importedIds: [...info.importedIds],
          dynamicallyImportedIds: [...info.dynamicallyImportedIds],
        })
      }
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        chunks.push({
          fileName: output.fileName,
          name: output.name,
          isEntry: output.isEntry,
          isDynamicEntry: output.isDynamicEntry,
          facadeModuleId: output.facadeModuleId,
          imports: [...output.imports],
          dynamicImports: [...output.dynamicImports],
          exports: [...output.exports],
          modules: Object.fromEntries(
            Object.entries(output.modules).map(([id, rendered]) => [
              id,
              {renderedLength: rendered.renderedLength, code: rendered.code},
            ]),
          ),
          code: '',
        })
      }
    },
    writeBundle(_outputOptions, bundle) {
      for (const chunk of chunks) {
        const output = bundle[chunk.fileName]
        if (output?.type === 'chunk') chunk.code = output.code
      }
    },
  }

  const overrideDir =
    overrides.length > 0 ? fs.mkdtempSync(path.join(os.tmpdir(), 'export-cost-entry-')) : undefined
  const libEntry: Record<string, string> = {}
  for (const override of overrides) {
    const original = path.join(SANITY_PACKAGE, 'src/_exports', `${override.entry}.ts`)
    const except = new Set(override.except)
    const kept = override.exports.filter((name) => !except.has(name))
    const file = overrideModulePath(overrideDir!, override.entry)
    fs.writeFileSync(
      file,
      // The original entry's side-effect imports (stylesheets, augmentations) still run
      `import ${JSON.stringify(original)}\nexport {${kept.join(', ')}} from ${JSON.stringify(original)}\n`,
    )
    libEntry[override.entry] = file
  }

  const cwd = process.cwd()
  // Panda CSS reads its config and `include` globs from the working directory
  process.chdir(SANITY_PACKAGE)
  try {
    await build({
      configFile: path.join(SANITY_PACKAGE, 'package.bundle.ts'),
      configLoader: 'runner',
      logLevel: 'error',
      plugins: [capture],
      build: {
        emptyOutDir: true,
        sourcemap: false,
        reportCompressedSize: false,
        lib: overrideDir ? {entry: libEntry} : undefined,
        rolldownOptions: {output: {dir: outDir}},
      },
    })
  } finally {
    process.chdir(cwd)
    if (overrideDir) fs.rmSync(overrideDir, {recursive: true, force: true})
  }

  return {outDir, entries, chunks, modules}
}
