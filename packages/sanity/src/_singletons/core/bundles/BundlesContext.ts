import {createContext} from 'react'

import type {BundlesContextValue} from '../../../core/store/bundles/BundlesProvider'

/**
 * @internal
 */
export const BundlesContext = createContext<BundlesContextValue | null>(null)
