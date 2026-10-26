import {type ReactNode, useContext} from 'react'
import {VariantDetailHeaderContext} from 'sanity/_singletons'

import {type SystemVariant} from '../../types'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * Replaces the identity and properties row of the variant detail page header (title, description and the two
 * properties panels) with the host's own block. The back button and the action rail stay. The default is `null`:
 * the stock header renders, unchanged, unless a provider supplies a renderer.
 *
 * @internal
 */
export interface VariantDetailHeaderProps {
  variant: SystemVariant
  /** Document groups that hold a version of the variant (the table's rows). */
  documentCount: number
  documentsLoading: boolean
}

/** @internal */
export type RenderVariantDetailHeader = (props: VariantDetailHeaderProps) => ReactNode

/** @internal Provide a renderer (a stable function) for the variant detail page's header block, or `null` for stock. */
export const VariantDetailHeaderProvider = VariantDetailHeaderContext.Provider

/** @internal */
export function useVariantDetailHeader(): RenderVariantDetailHeader | null {
  return useContext(VariantDetailHeaderContext)
}
