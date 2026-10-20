import {type ReactNode, useContext} from 'react'
import {VariantFilterAddControlContext} from 'sanity/_singletons'

import {type ConditionFacet} from '../util'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * Replaces the "Add filter" entry of the Variants tool's filter bar (a two-level menu of dimensions and values) with the host's control, so the tool
 * can use the same dimension and value picker as the perspective bar. The host provides a plain function that returns the control for the facets, the
 * current values and the handlers; the bar keeps drawing the chips and Clear. With no provider the shipped menu is used.
 *
 * @internal
 */
export interface VariantFilterAddControlProps {
  facets: ConditionFacet[]
  value: Record<string, string[]>
  /** Adds the value to the dimension's filter, or removes it when it is already there (OR within a dimension). */
  onToggleValue: (key: string, val: string) => void
  onClear: () => void
}

/** @internal */
export type RenderVariantFilterAddControl = (props: VariantFilterAddControlProps) => ReactNode

/** @internal Provide a function that draws the "Add filter" control; `null` keeps the shipped menu. */
export const VariantFilterAddControlProvider = VariantFilterAddControlContext.Provider

/** @internal */
export function useVariantFilterAddControl(): RenderVariantFilterAddControl | null {
  return useContext(VariantFilterAddControlContext)
}
