import {type Rolldown} from 'vite'

/**
 * The Panda cascade layers of a project, named after its class name prefix (the `u-` convention
 * of sanity-io/ui#3228), so that two Panda bundles on one page never share a layer.
 */
export function pandaLayers<Prefix extends string>(prefix: Prefix) {
  return {
    reset: `${prefix}-reset`,
    base: `${prefix}-base`,
    tokens: `${prefix}-tokens`,
    recipes: `${prefix}-recipes`,
    utilities: `${prefix}-utilities`,
  } as const
}

/** The names of {@link pandaLayers}, in Panda's order. */
export function pandaLayerNames(prefix: string): string[] {
  return Object.values(pandaLayers(prefix))
}

/**
 * The cascade layers a studio page orders, lowest priority first. Layer order decides the cascade
 * before specificity does, so every layer of `@sanity/ui` comes before the studio's:
 *
 * - `sui`, the layer of `ui5`'s stylesheet, first: its `sui.global` holds a universal reset
 *   (`* {margin: 0; padding: 0; …}`) that has to lose to every rule styling the same elements —
 *   placed after `u-styled`, it zeroes the padding of a `@sanity/ui` v4 `Box`.
 * - `u-reset` … `u-utilities`, the Panda layers of `@sanity/ui/styles.css` (sanity-io/ui#3228),
 *   and `u-styled`, the layer `@sanity/ui` v4 wraps its styled-components rules in
 *   (sanity-io/ui#3233). `ThemeProvider` emits `@layer sui, u-tokens, u-utilities, u-styled;`
 *   itself, which this order agrees with.
 * - `sanity-*`, the studio's own Panda layers, last: the studio's `.css.ts` rules override the
 *   libraries' rules on the same elements.
 *
 * The statement goes at the top of the studio's stylesheet (`bundle.css`, and `layers.css` in
 * the apps that build the studio from source), which loads before styled-components' `<style>`
 * tag; the first statement a page sees fixes the order. The test studio's `test-studio-*`
 * layers are declared after it in `layers.css`, which appends them last.
 */
export const STUDIO_LAYER_ORDER: readonly string[] = [
  'sui',
  ...pandaLayerNames('u'),
  'u-styled',
  ...pandaLayerNames('sanity'),
]

/** The `@layer` statement that declares `layers` in that order. */
export function layerOrderStatement(layers: readonly string[]): string {
  return `@layer ${layers.join(', ')};`
}

/**
 * Prepends the {@link STUDIO_LAYER_ORDER} statement to the stylesheet
 * `@sanity/pandacss-tsdown-plugin` emits (the `panda` option of `@sanity/tsdown-config`), which
 * writes the `@layer` blocks without an order statement. Append it to a tsdown config after
 * `defineConfig()`, so that its `generateBundle` runs after the plugin has emitted the asset:
 *
 * ```ts
 * mergeConfig(await defineConfig({panda: true}), {plugins: [pandaLayerOrder()]})
 * ```
 */
export function pandaLayerOrder(options: {fileName?: string} = {}): Rolldown.Plugin {
  const fileName = options.fileName ?? 'bundle.css'

  return {
    name: 'repo:panda-layer-order',
    generateBundle(_options, bundle) {
      const asset = bundle[fileName]
      if (asset?.type === 'asset' && typeof asset.source === 'string') {
        asset.source = `${layerOrderStatement(STUDIO_LAYER_ORDER)}\n${asset.source}`
      }
    },
  }
}
