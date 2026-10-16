import {type Rolldown} from 'vite'

/**
 * The one `@layer` statement the studio still declares. The studio's own CSS has no cascade
 * layers (`panda: {cascadeLayers: false}` in packages/sanity/tsdown.config.ts, and
 * `removeCascadeLayers()` for the stylesheet `@pandacss/vite` fills), and unlayered CSS beats every
 * layered rule regardless of specificity, so nothing of the studio's needs ordering. What may
 * still be layered on the page is other libraries' CSS: `ui5/styles.css` puts its universal reset
 * (`* {margin: 0; padding: 0; …}`) in `sui.global`, and `@sanity/ui` 4.4.4–4.4.7 put their static
 * styles in `u-tokens` and `u-utilities` (4.4.8 ships them unlayered, sanity-io/ui#3235). Two
 * layers only compete by their order, and a page fixes the order by the first `@layer` statement
 * it sees: declaring `sui` first keeps the reset below such a v4's static styles wherever this
 * statement loads before either stylesheet (the entry chunks of `sanity` import `bundle.css`
 * first; the dev studios, Storybook, the vitest browser setup and the CDN bundle load the
 * stylesheet `@pandacss/vite` fills first). The v4 layers need no ordering of their own:
 * `@sanity/ui/styles.css` declares them in the order it wants.
 *
 * With the catalog on 4.4.8 nothing but `sui` is layered on the studio's own pages, so this only
 * matters for a page that still loads one of those v4 versions (a plugin's own copy). Remove it,
 * `layerOrderPlugin()` and the first line of layers.css together once that no longer matters: a
 * single layer has nothing to be ordered against.
 */
export const LAYER_ORDER_STATEMENT = '@layer sui;'

/**
 * Prepends {@link LAYER_ORDER_STATEMENT} to the stylesheet `@sanity/pandacss-tsdown-plugin` emits
 * (the `panda` option of `@sanity/tsdown-config`). Append it to a tsdown config after
 * `defineConfig()`, so that its `generateBundle` runs after the plugin has emitted the asset:
 *
 * ```ts
 * mergeConfig(await defineConfig({panda: {cascadeLayers: false}}), {plugins: [layerOrderPlugin()]})
 * ```
 */
export function layerOrderPlugin(options: {fileName?: string} = {}): Rolldown.Plugin {
  const fileName = options.fileName ?? 'bundle.css'

  return {
    name: 'repo:layer-order',
    generateBundle(_options, bundle) {
      const asset = bundle[fileName]
      if (asset?.type === 'asset' && typeof asset.source === 'string') {
        asset.source = `${LAYER_ORDER_STATEMENT}\n${asset.source}`
      }
    },
  }
}
