import path from 'path'
import viteReact from '@vitejs/plugin-react'
import readPkgUp from 'read-pkg-up'
import resolveFrom from 'resolve-from'
import type {InlineConfig} from 'vite'
import {isSanityMonorepo} from './isSanityMonorepo'

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
    plugins: [viteReact({})],
    envPrefix: 'SANITY_STUDIO_',
    root: cwd,
    server: {middlewareMode: 'ssr'},
    logLevel: 'silent',
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

  const [reactPath, reactDomPath, styledComponentsPath] = await Promise.all([
    getModulePath('react', cwd),
    getModulePath('react-dom', cwd),
    getModulePath('styled-components', cwd),
  ])

  return {
    $config: path.resolve(cwd, 'sanity.config.ts'),
    react: reactPath,
    ...monorepoAliases,
    '/$studio': path.resolve(__dirname, '../src/app/main.tsx'),
    'react/jsx-dev-runtime': `${reactPath}/jsx-dev-runtime`,
    'styled-components': styledComponentsPath,

    // @todo For some reason this doesn't work, failing because react-dom
    // is not an ESM module. Need to investigate this more.
    // 'react-dom': reactDomPath,
  }
}

/**
 * Given a module name such as "styled-components", will resolve the _module path_,
 * eg if require.resolve(`styled-components`) resolves to:
 *   `/some/node_modules/styled-components/lib/cjs/styled.js`
 * this function will instead return
 *   `/some/node_modules/styled-components`
 *
 * This is done in order for aliases to be pointing to the right module in terms of
 * _file-system location_, without pointing to a specific commonjs/browser/module variant
 *
 * @internal
 */
async function getModulePath(mod: string, fromDir: string): Promise<string> {
  const modulePath = resolveFrom(fromDir, mod)
  const pkg = await readPkgUp({cwd: path.dirname(modulePath)})
  return pkg ? path.dirname(pkg.path) : modulePath
}

/**
 * Ensures that the given path both starts and ends with a single slash
 *
 * @internal
 */
function normalizeBasePath(pathName: string): string {
  return `/${pathName}/`.replace(/^\/+/, '/').replace(/\/+$/, '/')
}
