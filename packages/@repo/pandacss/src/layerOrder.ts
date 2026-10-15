import {type Rolldown} from 'vite'

/**
 * The one `@layer` statement the studio still declares. The studio's own CSS has no cascade
 * layers (`panda: {cascadeLayers: false}` in packages/sanity/tsdown.config.ts, and
 * `unlayeredPandaCss()` for the stylesheet `@pandacss/vite` fills), and unlayered CSS beats every
 * layered rule regardless of specificity, so nothing of the studio's needs ordering. What is still
 * layered on the page is other libraries' CSS: `ui5/styles.css` puts its universal reset
 * (`* {margin: 0; padding: 0; …}`) in `sui.global`, and `@sanity/ui` v4.4 still puts its static
 * styles in `u-tokens` and `u-utilities`. Two layers only compete by their order, and a page fixes
 * the order by the first `@layer` statement it sees: declaring `sui` first keeps the reset below
 * v4's static styles wherever this statement loads before either stylesheet (the entry chunks of
 * `sanity` import `bundle.css` first; the dev studios, Storybook, the vitest browser setup and the
 * CDN bundle load the stylesheet `@pandacss/vite` fills first). The v4 layers need no ordering of
 * their own: `@sanity/ui/styles.css` declares them in the order it wants.
 *
 * Remove once `@sanity/ui` v4 ships its static styles unlayered (in progress in sanity-io/ui):
 * unlayered v4 CSS beats `sui` by itself, and a single layer has nothing to be ordered against.
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
