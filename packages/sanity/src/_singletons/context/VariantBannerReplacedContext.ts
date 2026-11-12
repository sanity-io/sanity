import {createContext} from 'react'

/**
 * PROPOSED (Variants 2.0 test studio). True when the host draws its own "no version for this variant" banner, so the document pane does not draw
 * the stock one. Default false.
 * @internal
 */
export const VariantBannerReplacedContext = createContext<boolean>(false)
