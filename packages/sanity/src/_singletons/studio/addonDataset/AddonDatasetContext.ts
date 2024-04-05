import {createContext} from 'react'
import type {AddonDatasetContextValue} from 'sanity'

/**
 * @beta
 * @hidden
 */
export const AddonDatasetContext = createContext<AddonDatasetContextValue | null>(null)
