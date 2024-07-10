import {createContext} from 'react'

import type {MetadataWrapper} from '../../../core/store/bundles/createBundlesMetadataAggregator'

export const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

export const BundlesMetadataContext = createContext<{
  state: MetadataWrapper
  addBundleSlugsToListener: (slugs: string[]) => void
  removeBundleSlugsFromListener: (slugs: string[]) => void
} | null>(null)
