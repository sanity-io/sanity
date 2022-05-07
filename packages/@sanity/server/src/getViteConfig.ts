import path from 'path'
import type {InlineConfig} from 'vite'
import viteReact from '@vitejs/plugin-react'
import {getAliases} from './aliases'
import {normalizeBasePath} from './helpers'
import {loadSanityMonorepo} from './sanityMonorepo'
import {sanityBuildEntries, virtualEntryModuleId} from './vite/plugin-sanity-build-entries'
import {sanityDotWorkaroundPlugin} from './vite/plugin-sanity-dot-workaround'
import {sanityRuntimeRewritePlugin} from './vite/plugin-sanity-runtime-rewrite'
import {sanityFaviconsPlugin} from './vite/plugin-sanity-favicons'

export interface ViteOptions {
  /**
   * Root path of the studio/sanity app
   */
  cwd: string

  /**
   * Base path (eg under where to serve the app - `/studio` or similar)
   * Will be normalized by `getViteConfig` to ensure it starts and end with a `/`
   */
  basePath?: string

  /**
   * Output directory (eg where to place the built files, if any)
   */
  outputDir?: string

  /**
   * Whether or not to enable source maps
   */
  sourceMap?: boolean

  /**
   * Whether or not to minify the output (only used in `mode: 'production'`)
   */
  minify?: boolean

  /**
   * HTTP development server configuration
   */
  server?: {port?: number; host?: string}

  /**
   * Mode to run vite in - eg development or production
   */
  mode: 'development' | 'production'
}

/**
 * Get a configuration object for Vite based on the passed options
 *
 * @internal Only meant for consumption inside of Sanity modules, do not depend on this externally
 */
export async function getViteConfig(options: ViteOptions): Promise<InlineConfig> {
  const {
    cwd,
    mode,
    outputDir,
    // default to `true` when `mode=development`
    sourceMap = options.mode === 'development',
    server,
    minify,
    basePath: rawBasePath = '/',
  } = options

  const monorepo = await loadSanityMonorepo(cwd)
  const basePath = normalizeBasePath(rawBasePath)
  const faviconsPath = path.join(__dirname, 'static', 'favicons')
  const staticPath = `${basePath}static`

  const viteConfig: InlineConfig = {
    root: cwd,
    base: basePath,
    build: {
      outDir: outputDir || path.resolve(cwd, 'dist'),
      sourcemap: sourceMap,
    },
    server: {
      base: basePath,
      host: server?.host,
      port: server?.port || 3333,
      strictPort: true,
    },
    configFile: false,
    mode,
    plugins: [
      viteReact(),
      sanityDotWorkaroundPlugin(),
      sanityRuntimeRewritePlugin(),
      sanityBuildEntries({basePath, cwd, monorepo}),
      sanityFaviconsPlugin({faviconsPath, staticUrlPath: staticPath}),
    ],
    envPrefix: 'SANITY_STUDIO_',
    logLevel: mode === 'production' ? 'silent' : 'info',
    resolve: {
      alias: getAliases({monorepo}),
    },
  }

  if (mode === 'production') {
    viteConfig.build = {
      ...viteConfig.build,

      assetsDir: 'static',
      minify: minify ? 'esbuild' : false,
      emptyOutDir: false, // Rely on CLI to do this

      rollupOptions: {
        perf: true,
        input: {
          main: virtualEntryModuleId,
        },
      },
    }
  }

  return viteConfig
}
