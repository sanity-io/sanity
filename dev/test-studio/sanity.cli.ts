import path from 'path'
import {createCliConfig} from 'sanity/cli'
import {UserConfig} from 'vite'
// import {getConfig as getRxjsInsightsConfig} from '@rxjs-insights/plugin-base'

export default createCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'test',
  },

  // Can be overriden by:
  // A) `SANITY_STUDIO_REACT_STRICT_MODE=false yarn dev`
  // B) creating a `.env` file locally that sets the same env variable as above
  reactStrictMode: true,
  vite(viteConfig: UserConfig): UserConfig {
    /*
    const rxjsAliases = getRxjsInsightsConfig({
      installModule: path.join(__dirname, 'install.js'),
    }).aliases
    // */
    const rxjsAliases = {
      'rxjs/internal/operators/filter': path.dirname(
        require.resolve('@rxjs-insights/rxjs6/rxjs/operators')
      ),
      'rxjs/internal/Observable': path.dirname(require.resolve('@rxjs-insights/rxjs6/rxjs')),
      'rxjs/internal/operators/map': path.dirname(
        require.resolve('@rxjs-insights/rxjs6/rxjs/operators')
      ),
      rxjs: path.dirname(require.resolve('@rxjs-insights/rxjs6/rxjs')),
      'rxjs/operators': path.dirname(require.resolve('@rxjs-insights/rxjs6/rxjs/operators')),
      '@rxjs-insights/rxjs-module': path.dirname(require.resolve('rxjs')),
      '@rxjs-insights/rxjs-module/operators': path.dirname(require.resolve('rxjs/operators')),
      '@rxjs-insights/install-module': path.dirname(require.resolve('@rxjs-insights/rxjs6')),
    }
    return {
      ...viteConfig,
      build: {
        ...viteConfig.build,
        rollupOptions: {
          ...viteConfig.build?.rollupOptions,
          input: {
            // NOTE: this is required to build static files for the workshop frame
            'workshop/frame': path.resolve(__dirname, 'workshop/frame/index.html'),
          },
        },
      },
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...viteConfig.resolve?.alias,
          ...rxjsAliases,
        },
      },
    }
  },
})
