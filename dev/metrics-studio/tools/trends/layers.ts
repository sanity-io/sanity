/**
 * Which encoding layers the charts draw. Clicking a legend swatch toggles a
 * layer across the whole grid (40+ small multiples — toggling per chart would
 * be busywork) and the choice persists in the URL, so "look at this with the
 * bands off" is a shareable link, like `?range=` and `?branches=`.
 */
import {useCallback, useMemo} from 'react'

export const LAYERS = ['median', 'band', 'calibration', 'baseline'] as const
export type Layer = (typeof LAYERS)[number]

export interface LayerState {
  visible: (layer: Layer) => boolean
  toggle: (layer: Layer) => void
}

function isLayer(value: string): value is Layer {
  return (LAYERS as readonly string[]).includes(value)
}

/**
 * Encoded as the *hidden* set (`?layers=-band,-baseline`) rather than the
 * visible one: the default is everything on, and a param that only appears once
 * something is off keeps the common URL clean and makes the default obvious.
 */
export function parseHidden(param: string): Set<Layer> {
  const hidden = new Set<Layer>()
  for (const token of param.split(',')) {
    const name = token.startsWith('-') ? token.slice(1) : token
    if (isLayer(name)) hidden.add(name)
  }
  return hidden
}

export function serializeHidden(hidden: ReadonlySet<Layer>): string {
  // Stable order (LAYERS order, not insertion order) so the same visual state
  // always produces the same URL
  return LAYERS.filter((layer) => hidden.has(layer))
    .map((layer) => `-${layer}`)
    .join(',')
}

export function useLayerState(param: string, setParam: (next: string) => void): LayerState {
  const hidden = useMemo(() => parseHidden(param), [param])
  const toggle = useCallback(
    (layer: Layer) => {
      const next = new Set(hidden)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      setParam(serializeHidden(next))
    },
    [hidden, setParam],
  )
  return {
    visible: (layer) => !hidden.has(layer),
    toggle,
  }
}

/** Every layer visible — for call sites with no toggle UI (e.g. stories). */
export const ALL_LAYERS_VISIBLE: LayerState = {
  visible: () => true,
  toggle: () => {},
}
