import {VariantBannerReplacedContext} from 'sanity/_singletons'

/**
 * PROPOSED (Variants 2.0 test studio). Provide `true` when the host draws its own "no version for this variant" and "this variant no longer exists" banners: the document pane then does
 * not draw the stock one. Default false, so Studio is unchanged without a provider.
 *
 * @internal
 */
export const VariantBannerReplacedProvider = VariantBannerReplacedContext.Provider
