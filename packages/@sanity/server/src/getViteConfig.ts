import path from 'path'
import {esbuildCommonjs, viteCommonjs} from '@originjs/vite-plugin-commonjs'
import viteReact from '@vitejs/plugin-react'
import {InlineConfig} from 'vite'
import {isSanityMonorepo} from './isSanityMonorepo'
import {DEFAULT_CANONICAL_MODULES, DEFAULT_COMMONJS_MODULES} from './constants'
import {viteCanonicalModules} from './vite/plugin-canonical-modules'

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
   * Mode to run vite in - eg development or production
   */
  mode: 'development' | 'production'
}

export interface SanityViteConfig extends InlineConfig {
  base: string
}

/**
 * Get a configuration object for Vite based on the passed options
 *
 * @internal Only meant for consumption inside of Sanity modules, do not depend on this externally
 */
export async function getViteConfig(options: ViteOptions): Promise<SanityViteConfig> {
  const {cwd, mode, outputDir, sourceMap, minify, basePath = '/'} = options
  const isMonorepo = await isSanityMonorepo(cwd)

  const viteConfig: SanityViteConfig = {
    base: normalizeBasePath(basePath),
    build: {
      outDir: outputDir || path.resolve(cwd, 'dist'),
      sourcemap: sourceMap,
    },
    configFile: false,
    mode,
    optimizeDeps: {
      esbuildOptions: {
        plugins: [esbuildCommonjs(DEFAULT_COMMONJS_MODULES)],
      },
      include: DEFAULT_COMMONJS_MODULES,
    },
    plugins: [
      viteReact({}),
      viteCanonicalModules({
        ids: DEFAULT_CANONICAL_MODULES,
        cwd,
      }),
      viteCommonjs({
        include: DEFAULT_COMMONJS_MODULES,
      }),
    ],
    envPrefix: 'SANITY_STUDIO_',
    root: cwd,
    server: {
      fs: {strict: false},
      middlewareMode: 'ssr',
    },
    logLevel: mode === 'production' ? 'silent' : undefined,
    resolve: {
      alias: await getAliases({cwd, isMonorepo}),
    },
  }

  if (mode === 'production') {
    viteConfig.build = {
      ...viteConfig.build,
      assetsDir: 'static',
      minify: minify ? 'esbuild' : false,
      emptyOutDir: false, // Rely on CLI to do this

      // NOTE: when the Studio is running within the monorepo, some packages which contain CommonJS
      // is located outside of `node_modules`. To work around this, we configure the `include`
      // option for Rollup’s CommonJS plugin here.
      commonjsOptions: isMonorepo
        ? {
            include: [
              /node_modules/,
              ...DEFAULT_COMMONJS_MODULES.map((id) => {
                return new RegExp(`${id.replace(/\//g, '\\/')}`)
              }),
            ],
          }
        : undefined,
      rollupOptions: {
        perf: true,
        input: {
          // @todo Figure out a better input for this
          main: path.resolve(__dirname, '../src/app/index.html'),
        },
      },
    }

    // @todo Figure out a better input for this
    viteConfig.root = path.resolve(__dirname, '../src/app')
  }

  return viteConfig
}

/**
 * Returns an object of aliases for vite to use.
 *
 * We explicitly add aliases for react, react-dom and styled-components because
 * multiple versions of these dependencies will cause quite a lot of issues.
 *
 * @todo Figure out a non-alias(?) way to spawn up the studio and the config
 */
async function getAliases(opts: {
  cwd: string
  isMonorepo: boolean
}): Promise<Record<string, string>> {
  const {cwd, isMonorepo} = opts

  // Load monorepo aliases (if the current Studio is located within the sanity monorepo)
  const devAliases: Record<string, string> = isMonorepo ? require('../../../../dev/aliases') : {}
  const monorepoAliases = Object.fromEntries(
    Object.entries(devAliases).map(([key, modulePath]) => {
      return [key, path.resolve(__dirname, '../../../..', modulePath)]
    })
  )

  return {
    $config: path.resolve(cwd, 'sanity.config.ts'),
    ...monorepoAliases,
    '/$studio': path.resolve(__dirname, '../src/app/main.tsx'),
  }
}

/**
 * Ensures that the given path both starts and ends with a single slash
 *
 * @internal
 */
function normalizeBasePath(pathName: string): string {
  return `/${pathName}/`.replace(/^\/+/, '/').replace(/\/+$/, '/')
}
