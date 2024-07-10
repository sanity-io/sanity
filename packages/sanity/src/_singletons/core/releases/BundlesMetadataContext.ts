import {createContext} from 'react'

import type {MetadataWrapper} from '../../../core/store/bundles/createBundlesMetadataAggregator'

/**
 * @internal
 */
export const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

interface BundlesMetadataContextValue {
  state: MetadataWrapper
  addBundleSlugsToListener: (slugs: string[]) => void
  removeBundleSlugsFromListener: (slugs: string[]) => void
}

/**
 * @internal
 * @hidden
 */
export const BundlesMetadataContext = createContext<BundlesMetadataContextValue | null>(null)
