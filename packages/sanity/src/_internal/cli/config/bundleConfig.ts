import viteReact from '@vitejs/plugin-react'
import readPkgUp from 'read-pkg-up'
import {build, type InlineConfig} from 'vite'

import {createExternalFromImportMap} from '../server/createExternalFromImportMap'
import {getSanityPkgExportAliases} from '../server/getBrowserAliases'
import {getStudioEnvironmentVariables} from '../server/getStudioEnvironmentVariables'
import {getMonorepoAliases, loadSanityMonorepo} from '../server/sanityMonorepo'

export async function bundleConfig(options: {
  configPath: string
  cwd: string
  importMap: {imports?: Record<string, string>}
  mode: 'development' | 'production'
  outDir: string
}): Promise<void> {
  const {configPath, cwd, importMap, mode, outDir} = options

  const minify = mode === 'production'
  const sourcemap = mode === 'development'
  const monorepo = await loadSanityMonorepo(cwd)

  const sanityPkgPath = (await readPkgUp({cwd: __dirname}))?.path
  if (!sanityPkgPath) {
    throw new Error('Unable to resolve `sanity` module root')
  }

  const viteConfig: InlineConfig = {
    // root: cwd,

    // Define a custom cache directory so that sanity's vite cache
    // does not conflict with any potential local vite projects
    cacheDir: 'node_modules/.sanity/vite/config',
    root: cwd,
    // base: basePath,
    build: {
      lib: {
        entry: configPath,
        formats: ['es'],
        fileName: 'sanity.config',
      },
      outDir,
      sourcemap,

      // assetsDir: 'static',
      minify: minify ? 'esbuild' : false,
      emptyOutDir: false, // Rely on CLI to do this

      rollupOptions: {
        external: createExternalFromImportMap(importMap),
      },
    },
    configFile: false,
    mode,
    plugins: [viteReact()],
    envPrefix: 'SANITY_STUDIO_',
    logLevel: mode === 'production' ? 'silent' : 'info',
    resolve: {
      alias: monorepo?.path
        ? await getMonorepoAliases(monorepo.path)
        : getSanityPkgExportAliases(sanityPkgPath),
      dedupe: ['styled-components'],
    },
    define: {
      // eslint-disable-next-line no-process-env
      '__SANITY_STAGING__': process.env.SANITY_INTERNAL_ENV === 'staging',
      'process.env.MODE': JSON.stringify(mode),
      /**
       * Yes, double negatives are confusing.
       * The default value of `SC_DISABLE_SPEEDY` is `process.env.NODE_ENV === 'production'`: https://github.com/styled-components/styled-components/blob/99c02f52d69e8e509c0bf012cadee7f8e819a6dd/packages/styled-components/src/constants.ts#L34
       * Which means that in production, use the much faster way of inserting CSS rules, based on the CSSStyleSheet API (https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule)
       * while in dev mode, use the slower way of inserting CSS rules, which appends text nodes to the `<style>` tag: https://github.com/styled-components/styled-components/blob/99c02f52d69e8e509c0bf012cadee7f8e819a6dd/packages/styled-components/src/sheet/Tag.ts#L74-L76
       * There are historical reasons for this, primarily that browsers initially did not support editing CSS rules in the DevTools inspector if `CSSStyleSheet.insetRule` were used.
       * However, that's no longer the case (since Chrome 81 back in April 2020: https://developer.chrome.com/docs/css-ui/css-in-js), the latest version of FireFox also supports it,
       * and there is no longer any reason to use the much slower method in dev mode.
       */
      'process.env.SC_DISABLE_SPEEDY': JSON.stringify('false'),
      ...getStudioEnvironmentVariables({prefix: 'process.env.', jsonEncode: true}),
    },
  }

  await build(viteConfig)
}
