import {createContext} from 'react'

import type {AddonDatasetContextValue} from '../../../../core/studio/addonDataset/types'

/**
 * @beta
 * @hidden
 */
export const AddonDatasetContext = createContext<AddonDatasetContextValue | null>(null)
