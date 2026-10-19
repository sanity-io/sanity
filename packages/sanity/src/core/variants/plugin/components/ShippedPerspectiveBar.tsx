import {createContext, useContext} from 'react'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * With `beta.variants` on, the shipped Studio draws its own perspective bar (Version and Variant filters) under the
 * navbar and hides the navbar's state pill. A host that supplies its own perspective design (C1) returns `false`
 * from this hook: the shipped bar is not drawn and the navbar keeps its state pill. The default hook returns `true`,
 * so Studio is unchanged unless a provider is mounted.
 *
 * @internal
 */
export type UseShippedPerspectiveBar = () => boolean

const shown: UseShippedPerspectiveBar = () => true

const ShippedPerspectiveBarContext = createContext<UseShippedPerspectiveBar>(shown)

/** @internal Provide a hook (a stable function) that says whether the shipped perspective bar is drawn. */
export const ShippedPerspectiveBarProvider = ShippedPerspectiveBarContext.Provider

/** @internal */
export function useShippedPerspectiveBar(): boolean {
  // The context value is a stable hook supplied once by the host, so calling it keeps the hook order.
  const useShown = useContext(ShippedPerspectiveBarContext)
  return useShown()
}
