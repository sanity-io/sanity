import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {pandacss} from '@pandacss/vite'
import {type BrowserslistQueries, viteBuildTarget} from '@repo/browser-targets'
import {viteCssModules} from '@repo/css-modules-kit'
import {MADE_WITH_PANDA_SYMBOL} from '@sanity/pandacss-tsdown-plugin'
import {removeCascadeLayers} from '@sanity/pandacss-tsdown-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import {Features} from 'lightningcss'
import escapeRegExp from 'lodash-es/escapeRegExp.js'
import {
  esmExternalRequirePlugin,
  type LibraryOptions,
  normalizePath,
  type Plugin,
  type Rolldown,
  type UserConfig,
} from 'vite'

/**
 * The stylesheet `@pandacss/vite` fills with the generated CSS of a Panda package (Panda treats the
 * CSS file that declares its layers as the generated CSS root), imported from every library entry
 * by `pandaCssImportPlugin()`.
 */
const PANDA_CSS = fileURLToPath(new URL('./panda.css', import.meta.url))

export interface DefaultConfigOptions {
  /**
   * The version of the package being bundled (from that package's own package.json). Baked into
   * the bundle as the `__PKG_VERSION__` global, which `SANITY_VERSION`
   * (packages/sanity/src/core/version.ts) reports at runtime. The auto-update UI compares it to
   * the module CDN manifest, so it must match the version the bundle is uploaded as — reading it
   * from the wrong package.json causes an endless "Reload to update" loop in auto-updating
   * studios.
   */
  version: string
  /**
   * The `browserslist` field of the package being bundled (Baseline 2026 for Studio v7, see
   * "Browser support" in the `sanity` README). The bundle's JS and CSS are lowered for exactly
   * these browsers, so an auto-updating studio gets the same browser support as one built from
   * the npm package.
   */
  browserslist: BrowserslistQueries
  /**
   * How the package styles its components: Panda CSS `.css.ts` modules (`sanity`, from the
   * package's own `panda.config.ts`) or CSS modules (`@sanity/vision`, compiled with the Lightning
   * CSS scoping and class names of its package build, see @repo/css-modules-kit).
   */
  styles: 'panda' | 'css-modules'
  /**
   * The modules the studio preloads at boot so lazy chunks every studio needs do not load one
   * after another. Only the auto-updating `sanity` bundle sets it: a package without it (and every
   * other build of `sanity`) has no list and preloads nothing.
   */
  preload?: PreloadModulesOptions
}

export function createDefaultConfig({
  version,
  browserslist,
  styles,
  preload,
}: DefaultConfigOptions): UserConfig {
  const cssModules = styles === 'css-modules' ? viteCssModules : undefined

  return {
    appType: 'custom',
    // Lightning CSS polyfills `light-dark()` for targets that predate it (Vite 8's default
    // `baseline-widely-available`, Chrome 111 / Safari 16.4, did) with `--lightningcss-light` /
    // `--lightningcss-dark` toggled only by `prefers-color-scheme`, so Studio theme colors would
    // follow the OS instead of `color-scheme` when the two disagree. Every Baseline 2026 browser
    // supports `light-dark()`, so `build.target` below already leaves it alone; the polyfill
    // stays disabled — same as Tailwind — so it can never come back through a target change.
    // See https://github.com/parcel-bundler/lightningcss/issues/873
    //
    // Panda puts a `:root {--made-with-panda: '🐼'}` marker in every stylesheet it generates, and
    // has no option to leave it out. The package build drops it by listing it in Lightning CSS's
    // `unusedSymbols` (`@sanity/pandacss-tsdown-plugin`); Vite's CSS minifier passes these options
    // to Lightning CSS, so the CDN bundle drops it the same way.
    css: {
      transformer: cssModules?.transformer,
      lightningcss: {
        ...cssModules?.lightningcss,
        exclude: Features.LightDark,
        ...(styles === 'panda' ? {unusedSymbols: [MADE_WITH_PANDA_SYMBOL]} : {}),
      },
    },
    define: {
      '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
      '__PKG_VERSION__': JSON.stringify(version),
      'process.env.NODE_ENV': '"production"',
      'process.env': {},
    },
    plugins: [
      // `compiler` runs React Compiler through `oxc-transform-react`, in the same native pass
      // as the TypeScript/JSX transform (no babel in the pipeline)
      viteReact({compiler: {target: '19'}}),
      ...(styles === 'panda'
        ? [
            // Panda CSS for the package's `.css.ts` modules, from the `panda.config.ts` of the
            // package being bundled (vite runs from its directory): the `css()` calls are
            // rewritten to class names (content-hashed, so a release cannot reuse the previous
            // release's names for other rules, SAPP-4639) and the CSS fills the `panda.css` import
            // that `pandaCssImportPlugin` adds to every entry, without Panda's cascade layers like
            // the package's own `bundle.css` (`removeCascadeLayers()` is the pass behind
            // `cascadeLayers: false`)
            pandacss({transform: true}),
            removeCascadeLayers(['reset', 'base', 'tokens', 'recipes', 'utilities']),
            pandaCssImportPlugin(),
          ]
        : []),
      cleanupCssOutputPlugin(),
      ...(preload ? [preloadModulesPlugin(preload)] : []),
      esmExternalRequirePlugin({
        // self-externals are required here in order to ensure that the presentation
        // tool and future transitive dependencies that require sanity do not
        // re-include sanity in their bundle
        external: ['react', 'react-dom', 'styled-components', 'sanity', '@sanity/vision'].flatMap(
          (dependency) => [
            dependency,
            // this matches `react/jsx-runtime`, `sanity/presentation` etc
            new RegExp(`^${escapeRegExp(dependency)}\\/`),
          ],
        ),
      }),
    ],
    build: {
      // The JS `target` stays at Vite's default (`baseline-widely-available`): Rolldown skips its
      // transform for modules that are already JS (Vite's Oxc plugin has compiled the TSX) when
      // the target needs no syntax lowering, which every Baseline 2026 engine is, and the
      // `styledComponents` transform plugin below is skipped along with it
      cssTarget: viteBuildTarget(browserslist),
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        entry: {},
        formats: ['es'],
      },
      rolldownOptions: {
        output: {
          minify: true,
          exports: 'named',
          dir: 'dist',
          format: 'es',
          // Due to module server expecting `.mjs`, and packages/sanity/package.json#type now being `module`, it's necessary to configure vite to continue using `.mjs`
          // Otherwise it'll start using `.js` instead: https://github.com/vitejs/vite/blob/a3cd262f37228967e455617e982b35fccc49ffe9/packages/vite/src/node/build.ts#L664-L679
          entryFileNames: '[name].mjs',
          chunkFileNames: '[name]-[hash].mjs',
          // CSS assets get a predictable name so the module server can serve them at a known URL
          assetFileNames: (assetInfo) =>
            assetInfo.names?.some((n) => n.endsWith('.css'))
              ? 'index.css'
              : '[name]-[hash][extname]',
        },
        transform: {
          // Same options as pkg-utils: https://github.com/sanity-io/pkg-utils/blob/f4e229e2641049008b375caf67576130be83fcdd/packages/%40sanity/pkg-utils/src/node/tasks/rollup/resolveRollupConfig.ts#L220-L227
          plugins: {
            styledComponents: {
              // Unnecessary, as the way we use styled-components in Sanity is usually by wrapping `@sanity/ui` primitives, not declaring new ones like "const Button = styled.button``"
              fileName: false,
              // Native template literals take less space than this transpilation
              transpileTemplateLiterals: false,
              // Massively helps dead code elimination and tree-shaking
              pure: true,
              // disabled, as pkg-utils tends to be used for npm publishing, while other tooling, like `sanity dev`, `next dev`, etc are used for testing
              cssProp: false,
            },
          },
        },
        treeshake: true,
      },
    },
  }
}

/** The module ids of the entries of a library build (forward slashes on every platform). */
export function libraryEntryIds(
  root: string,
  entry: LibraryOptions['entry'] | undefined,
): Set<string> {
  const list =
    typeof entry === 'string' ? [entry] : Array.isArray(entry) ? entry : Object.values(entry ?? {})
  return new Set(list.map((file) => normalizePath(path.resolve(root, file))))
}

/** Prepends the import of the stylesheet `@pandacss/vite` fills (`panda.css`) to an entry module. */
export function withPandaCssImport(code: string): string {
  return `import ${JSON.stringify(PANDA_CSS)}\n${code}`
}

/**
 * Imports the stylesheet `@pandacss/vite` fills (`panda.css`, next to this module) from every
 * library entry, so the generated CSS ends up in the bundle's CSS asset (`index.css`). The built
 * packages carry an equivalent `import 'sanity/bundle.css'` in their entry chunks; the CDN bundle
 * is built from the sources, where no such import exists. `cleanupCssOutputPlugin` strips the
 * import from the emitted chunks again, since the CDN serves the CSS through a `<link>` tag.
 */
export function pandaCssImportPlugin(): Plugin {
  let entries = new Set<string>()

  return {
    name: 'sanity/panda-css-import',
    apply: 'build',
    configResolved(config) {
      entries = libraryEntryIds(config.root, config.build.lib ? config.build.lib.entry : undefined)
    },
    transform(code, id) {
      return entries.has(id) ? {code: withPandaCssImport(code), map: null} : null
    },
  }
}

/**
 * The build-time global `core/studio/preloadModules.ts` reads. Only the bundle build (this
 * package) defines it, as a one-element array holding {@link PRELOAD_SENTINEL} that
 * `preloadModulesPlugin()` swaps for the real list once the chunk file names are known; every
 * other build of `sanity` leaves it undefined, and the studio preloads nothing.
 */
const PRELOAD_MODULES_GLOBAL = '__SANITY_PRELOAD_MODULES__'
const PRELOAD_SENTINEL = '__sanity_preload_modules_placeholder__'
// The minifier may print the array and its string with either quote style
const PRELOAD_PLACEHOLDER_RE = new RegExp(`\\[\\s*(["'\`])${PRELOAD_SENTINEL}\\1\\s*\\]`, 'g')

export interface PreloadModulesOptions {
  /**
   * The key of the library entry (in `build.lib.entry`) whose static imports are already loaded
   * when the studio boots, so they are left out of the list.
   */
  entry: string
  /**
   * Source files, relative to the Vite root, that are `import()`ed lazily but that every studio
   * needs right after boot. Each must stay a chunk boundary of its own: the list holds the static
   * closure of each one's chunk, and no other lazy chunk.
   */
  lazyBoundaries: string[]
}

/** Resolves `to` against the directory of the chunk file `from`, as a relative module specifier. */
function relativeChunkSpecifier(from: string, to: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), to)
  return relative.startsWith('.') ? relative : `./${relative}`
}

/**
 * Computes the modules the studio preloads at boot (see `core/studio/preloadModules.ts`) and bakes
 * them into the chunk that reads {@link PRELOAD_MODULES_GLOBAL}, as module specifiers relative to
 * that chunk so they resolve under whichever version the module server redirects to.
 *
 * The list is the static import closure of every {@link PreloadModulesOptions.lazyBoundaries}
 * chunk minus what the entry already loads statically: an `import()` is only discovered once the
 * code that calls it runs, so a lazy chunk and its imports are fetched in sequence unless something
 * fetches them ahead of time. Dynamic imports are never followed, so lazy tool code stays out. The
 * build fails when a boundary stops being a chunk boundary, when the list would reach into the
 * chunk of another entry, or when the global is not found in exactly one chunk of the entry's
 * static closure.
 */
export function preloadModulesPlugin(options: PreloadModulesOptions): Plugin {
  let root = ''
  let libraryEntries: Record<string, string> = {}

  return {
    name: 'sanity/preload-modules',
    apply: 'build',
    config() {
      return {define: {[PRELOAD_MODULES_GLOBAL]: JSON.stringify([PRELOAD_SENTINEL])}}
    },
    configResolved(config) {
      root = config.root
      const entry = config.build.lib ? config.build.lib.entry : undefined
      if (!entry || typeof entry === 'string' || Array.isArray(entry)) {
        throw new Error('sanity/preload-modules needs `build.lib.entry` to be an object')
      }
      libraryEntries = entry
    },
    generateBundle(_options, bundle) {
      const chunks = new Map<string, Rolldown.OutputChunk>()
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') chunks.set(output.fileName, output)
      }
      const facadeOf = (id: string) => normalizePath(path.resolve(root, id))
      const findChunk = (id: string, dynamicEntry: boolean) =>
        [...chunks.values()].find(
          (chunk) =>
            chunk.facadeModuleId !== null &&
            normalizePath(chunk.facadeModuleId) === id &&
            (dynamicEntry ? chunk.isDynamicEntry : chunk.isEntry),
        )
      // Imports of modules outside of the bundle (react, `sanity/router`) are not chunks
      const closure = (start: Rolldown.OutputChunk, into = new Set<string>()) => {
        const queue = [start.fileName]
        for (const fileName of queue) {
          if (into.has(fileName)) continue
          const chunk = chunks.get(fileName)
          if (!chunk) continue
          into.add(fileName)
          queue.push(...chunk.imports)
        }
        return into
      }

      if (!libraryEntries[options.entry]) {
        this.error(`preload entry "${options.entry}" is not in \`build.lib.entry\``)
      }
      const entryChunk = findChunk(facadeOf(libraryEntries[options.entry]), false)
      if (!entryChunk) {
        this.error(`preload entry "${options.entry}" did not produce an entry chunk`)
      }
      const loadedAtBoot = closure(entryChunk)

      const preload = new Set<string>()
      for (const source of options.lazyBoundaries) {
        const boundary = findChunk(facadeOf(source), true)
        if (!boundary) {
          this.error(
            `${source} is no longer a chunk of its own that is loaded with \`import()\`: a static ` +
              'import elsewhere pulled it into a shared chunk, or nothing imports it lazily anymore. ' +
              'Fix the import graph, or remove it from `lazyBoundaries`.',
          )
        }
        for (const fileName of closure(boundary)) {
          if (loadedAtBoot.has(fileName)) continue
          const chunk = chunks.get(fileName)!
          if (chunk.isEntry) {
            this.error(
              `Preloading ${source} would reach into the entry chunk ${fileName}, which is not ` +
                `the "${options.entry}" entry. Entries other than "${options.entry}" load on demand.`,
            )
          }
          preload.add(fileName)
        }
      }

      const holders = [...chunks.values()].filter((chunk) => chunk.code.includes(PRELOAD_SENTINEL))
      if (holders.length !== 1 || !loadedAtBoot.has(holders[0].fileName)) {
        this.error(
          `Expected \`${PRELOAD_MODULES_GLOBAL}\` in exactly one chunk that "${options.entry}" ` +
            `imports statically, found it in: ${holders.map((chunk) => chunk.fileName).join(', ') || 'no chunk'}`,
        )
      }
      const [holder] = holders
      const specifiers = [...preload].map((fileName) =>
        relativeChunkSpecifier(holder.fileName, fileName),
      )
      holder.code = holder.code.replace(PRELOAD_PLACEHOLDER_RE, () => JSON.stringify(specifiers))
    },
  }
}

/**
 * Matches Vite's internal "hash update marker": a CSS comment of the form
 * `$vite$:N` that Rolldown's `vite-css-post` plugin appends to finalized CSS to
 * force a different content hash (a workaround for a Chromium `crossorigin`
 * caching bug, https://github.com/vitejs/vite/issues/18038).
 *
 * The marker is meant to be stripped again before the asset is written, but
 * Rolldown's library / non-code-split path (`build.lib` defaults
 * `cssCodeSplit` to `false`) emits the combined CSS asset late in
 * `generateBundle`, after its own strip step has already run, so the marker
 * leaks into the published CSS. We remove it ourselves below. This mirrors
 * Vite's own `viteHashUpdateMarkerRE`.
 */
const VITE_HASH_UPDATE_MARKER_RE = /\/\*\$vite\$:\d+\*\//g

/**
 * Cleans up the CSS-related output of the CDN bundle build:
 *
 * 1. Strips CSS imports from JS chunks, but ONLY for CSS files that were
 *    produced by the current build (e.g., by Panda CSS or CSS modules). When building
 *    CDN bundles, CSS is served separately via `<link>` tags (injected by the
 *    CLI's runtime script), so the JS bundles should not contain CSS import
 *    side-effects for these extracted CSS files. CSS imports from third-party
 *    packages that were bundled in (and whose CSS was processed into the same
 *    output) are safe to strip too — their styles end up in the combined CSS
 *    asset served via `<link>`. Imports referencing CSS files NOT present in
 *    the bundle output are left untouched, since stripping them could lose
 *    styles that aren't in our CSS output.
 *
 * 2. Removes the leftover Vite hash-update marker (see
 *    {@link VITE_HASH_UPDATE_MARKER_RE}) from the emitted CSS assets so the CSS
 *    we publish to the CDN stays clean.
 */
export function cleanupCssOutputPlugin(): Plugin {
  return {
    name: 'sanity/cleanup-css-output',
    apply: 'build',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // 1. Collect CSS asset filenames produced by this build (e.g.,
      //    Panda CSS or CSS modules output, Vite-processed CSS imports) and, while we're
      //    iterating, strip the internal Vite hash-update marker from each CSS
      //    asset's source.
      const cssAssetNames = new Set<string>()
      for (const [fileName, entry] of Object.entries(bundle)) {
        if (entry.type === 'asset' && fileName.endsWith('.css')) {
          cssAssetNames.add(fileName)
          if (typeof entry.source === 'string') {
            entry.source = entry.source.replace(VITE_HASH_UPDATE_MARKER_RE, '')
          }
        }
      }

      if (cssAssetNames.size === 0) return

      // 2. Only strip imports that reference these specific CSS assets
      for (const [, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue

        for (const cssName of cssAssetNames) {
          const escaped = cssName.replace(/\./g, '\\.')
          const pattern = new RegExp(`import\\s+['"][^'"]*${escaped}['"];?\\n?`, 'g')
          chunk.code = chunk.code.replace(pattern, '/* css served separately via <link> tag */\n')
        }
      }
    },
  }
}
