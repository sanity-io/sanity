import {createContext} from 'react'

import type {MetadataWrapper} from '../../../core/store/bundles/createBundlesStore'

export const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

export const BundlesMetadataContext = createContext<{
  state: MetadataWrapper
  addBundleIds: (bundleIds: string[]) => void
  removeBundleIds: (bundleIds: string[]) => void
}>({
  state: DEFAULT_METADATA_STATE,
  addBundleIds: () => null,
  removeBundleIds: () => null,
})
