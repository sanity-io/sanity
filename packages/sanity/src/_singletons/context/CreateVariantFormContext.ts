import {createContext} from 'react'

/**
 * PROPOSED (Variants 2.0 Design Studio). Which "Create variant" form the version inventory draws: `stock` is the form as it ships, `final` is the
 * inset card of the signed-off spec (title above a full-width select, no title icons, the variant starts empty, "Create variant" for both the
 * inventory button and the primary action). The default is `stock`, so Studio is unchanged unless a host provides `final`.
 * @internal
 */
export const CreateVariantFormContext = createContext<'stock' | 'final'>('stock')
