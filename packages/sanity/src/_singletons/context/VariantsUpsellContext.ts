import {createContext} from 'react'

import type {VariantsUpsellContextValue} from '../../core/variants/contexts/upsell/types'

/**
 * @internal
 */
export const VariantsUpsellContext = createContext<VariantsUpsellContextValue | null>(null)
