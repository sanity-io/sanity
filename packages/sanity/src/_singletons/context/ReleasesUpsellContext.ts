import {createContext} from 'react'

import type {ReleasesUpsellContextValue} from '../../core/releases/contexts/upsell/types'

/**
 * @beta
 * @hidden
 */
export const ReleasesUpsellContext = createContext<ReleasesUpsellContextValue | null>(null)
