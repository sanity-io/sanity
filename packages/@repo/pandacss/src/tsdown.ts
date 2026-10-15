import {type Rolldown} from 'tsdown'

import {unwrapCascadeLayers} from './unwrapCascadeLayers.ts'

/**
 * Rewrites the stylesheet `@sanity/pandacss-tsdown-plugin` emits (the `panda` option of
 * `@sanity/tsdown-config`) without its cascade layers. Append it to a tsdown config after
 * `defineConfig()`, so that its `generateBundle` runs after the plugin has emitted the asset:
 *
 * ```ts
 * mergeConfig(await defineConfig({panda: true}), {plugins: [unlayeredPandaCss()]})
 * ```
 *
 * See `unwrapCascadeLayers` for why the studio's static CSS must stay unlayered.
 */
export function unlayeredPandaCss(options: {fileName?: string} = {}): Rolldown.Plugin {
  const fileName = options.fileName ?? 'bundle.css'

  return {
    name: 'repo:unlayered-panda-css',
    generateBundle(_outputOptions, bundle) {
      const asset = bundle[fileName]
      if (asset?.type === 'asset' && typeof asset.source === 'string') {
        asset.source = unwrapCascadeLayers(asset.source)
      }
    },
  }
}
