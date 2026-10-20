import {createContext} from 'sanity/_createContext'

import type {RenderVariantFilterAddControl} from '../../core/variants/tool/overview/VariantFilterAddControl'

/**
 * PROPOSED (Variants 2.0 test studio). A function that draws the Variants tool's "Add filter" control; `null` keeps the shipped menu.
 * @internal
 */
export const VariantFilterAddControlContext = createContext<RenderVariantFilterAddControl | null>(
  'sanity/_singletons/context/variant-filter-add-control',
  null,
)
