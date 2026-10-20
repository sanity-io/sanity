// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook-variants-2-0,
// branch explorations/variants-2-0, commit 0c9f1e058e, lib/explorations/comparison-surfaces/csChrome.tsx).
// Changes: the `classic` chrome and its context (`CsChromeProvider`, `ReadChip`) are removed. The studio only draws the
// `studio` chrome (the Variants 2.0 chip: one Card, the shape token's radius, flush 23px segments, bleed row actions), so
// the three helpers below return that constant and no React context is needed.
export type CsChrome = 'classic' | 'studio'

/** The studio always draws the Variants 2.0 chrome. */
export const useCsChrome = (): CsChrome => 'studio'

/** Chip height per chrome: classic is the shipped pill's 27px; studio is the Variants 2.0 chip's 25px. */
export const chipHeightFor = (chrome: CsChrome) => (chrome === 'studio' ? 25 : 27)

/** The mode of a row action (Add dimension, +N): the Variants 2.0 row draws them bleed. */
export const useRowActionMode = () => 'bleed' as const
