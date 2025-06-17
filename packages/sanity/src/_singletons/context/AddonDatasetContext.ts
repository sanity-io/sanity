import {createContext} from 'sanity/_createContext'

import type {AddonDatasetContextValue} from '../../core/studio/addonDataset/types'

/**
 * @beta
 * @hidden
 */
export const AddonDatasetContext: React.Context<AddonDatasetContextValue | null> =
  createContext<AddonDatasetContextValue | null>('sanity/_singletons/context/addon-dataset', null)
