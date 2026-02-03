import {createContext} from 'sanity/_createContext'

import type {AddonDatasetContextValue} from '../../core/studio/addonDataset/types'

/**
 * @beta
 * @hidden
 */
export const AddonDatasetContext = createContext<AddonDatasetContextValue | null>(
  'sanity/_singletons/context/addon-dataset',
  null,
)
