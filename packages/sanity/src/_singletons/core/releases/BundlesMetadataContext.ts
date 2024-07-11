import {createContext} from 'react'

import type {MetadataWrapper} from '../../../core/store/bundles/createBundlesMetadataAggregator'

/**
 * @internal
 */
export interface BundlesMetadataContextValue {
  state: MetadataWrapper
  addBundleSlugsToListener: (slugs: string[]) => void
  removeBundleSlugsFromListener: (slugs: string[]) => void
}

/**
 * @internal
 * @hidden
 */
export const BundlesMetadataContext = createContext<BundlesMetadataContextValue | null>(null)
