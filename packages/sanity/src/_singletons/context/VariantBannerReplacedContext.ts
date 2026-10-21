import {createContext} from 'sanity/_createContext'

/**
 * PROPOSED (Variants 2.0 test studio). True when the host draws its own "no version for this variant" and "this variant no longer exists" banners, so the document pane does not draw
 * the stock one. Default false.
 * @internal
 */
export const VariantBannerReplacedContext = createContext<boolean>(
  'sanity/_singletons/context/variant-banner-replaced',
  false,
)
