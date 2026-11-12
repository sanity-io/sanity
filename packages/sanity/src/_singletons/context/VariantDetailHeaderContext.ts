import {createContext} from 'react'

import type {RenderVariantDetailHeader} from '../../core/variants/tool/detail/VariantDetailHeader'

/**
 * PROPOSED (Variants 2.0 test studio). A function that draws the variant detail page's header block; `null` keeps the stock header.
 * @internal
 */
export const VariantDetailHeaderContext = createContext<RenderVariantDetailHeader | null>(null)
