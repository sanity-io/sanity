import path from 'node:path'

import {pandacss} from '@pandacss/vite'
import {PANDA_LAYERS_CSS_SPECIFIER, unlayeredPandaCss} from '@repo/pandacss/vite'
import {vanillaExtractPlugin} from '@sanity/vanilla-extract-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import {Features} from 'lightningcss'
import escapeRegExp from 'lodash-es/escapeRegExp.js'
import {esmExternalRequirePlugin, normalizePath, type Plugin, type UserConfig} from 'vite'

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
   * How the package writes its `.css.ts` modules: Panda CSS (`sanity`, from the package's own
   * `panda.config.ts`) or vanilla-extract (`@sanity/vision`, until it moves to CSS modules).
   * Each compiler only runs for the packages that use it — the vanilla-extract plugin would
   * evaluate Panda's `.css.ts` modules as its own.
   * @defaultValue 'vanilla-extract'
   */
  styles?: 'panda' | 'vanilla-extract'
}

export function createDefaultConfig({
  version,
  styles = 'vanilla-extract',
}: DefaultConfigOptions): UserConfig {
  return {
    appType: 'custom',
    // Vite 8 minifies CSS with Lightning CSS against `baseline-widely-available`
    // (Chrome 111 / Safari 16.4). That target still down-transpiles `light-dark()`
    // into `--lightningcss-light` / `--lightningcss-dark` toggled only by
    // `prefers-color-scheme`, so Studio theme colors follow the OS instead of
    // `color-scheme` when the two disagree. Disable the polyfill — same as
    // Tailwind — rather than raising `build.cssTarget` (that would change other
    // CSS lowering). See https://github.com/parcel-bundler/lightningcss/issues/873
    css: {
      lightningcss: {
        exclude: Features.LightDark,
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
            // release's names for other rules, SAPP-4639) and the CSS fills the
            // `@repo/pandacss/layers.css` import that `pandaLayersCssImportPlugin` adds to every
            // entry, without cascade layers like the package's own `bundle.css` (see
            // @repo/pandacss)
            pandacss({transform: true}),
            unlayeredPandaCss(),
            pandaLayersCssImportPlugin(),
          ]
        : [
            // `identifiers: 'safe'` includes the package version in CDN class names so a release
            // cannot reuse the previous release's names (SAPP-4639).
            vanillaExtractPlugin({identifiers: 'safe'}),
          ]),
      cleanupCssOutputPlugin(),
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

/**
 * Imports the stylesheet `@pandacss/vite` fills (`@repo/pandacss/layers.css`) from every library
 * entry, so the generated CSS ends up in the bundle's CSS asset (`index.css`). The built packages
 * carry an equivalent `import 'sanity/bundle.css'` in their entry chunks; the CDN bundle is built
 * from the sources, where no such import exists. `cleanupCssOutputPlugin` strips the import from
 * the emitted chunks again, since the CDN serves the CSS through a `<link>` tag.
 */
export function pandaLayersCssImportPlugin(): Plugin {
  let entries = new Set<string>()

  return {
    name: 'sanity/panda-layers-css-import',
    apply: 'build',
    configResolved(config) {
      const entry = config.build.lib ? config.build.lib.entry : undefined
      const list =
        typeof entry === 'string'
          ? [entry]
          : Array.isArray(entry)
            ? entry
            : Object.values(entry ?? {})
      // Module ids use forward slashes on every platform
      entries = new Set(list.map((file) => normalizePath(path.resolve(config.root, file))))
    },
    transform(code, id) {
      if (!entries.has(id)) return null
      return {code: `import ${JSON.stringify(PANDA_LAYERS_CSS_SPECIFIER)}\n${code}`, map: null}
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
 *    produced by the current build (e.g., by Panda CSS or vanilla-extract). When building
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
      //    Panda CSS or vanilla-extract output, Vite-processed CSS imports) and, while we're
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
