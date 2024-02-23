import {createContext} from 'react'

import {type AddonDatasetContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const AddonDatasetContext = createContext<AddonDatasetContextValue | null>(null)
