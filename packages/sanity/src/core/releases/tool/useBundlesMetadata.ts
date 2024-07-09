import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {useBundlesStore} from 'sanity'

import {type MetadataWrapper} from '../../store/bundles/createBundlesStore'

type BundlesMetadata = {matches: number; lastEdited: string}

export type BundlesMetadataMap = Record<string, BundlesMetadata>

const DEFAULT_METADATA_STATE: MetadataWrapper = {
  data: null,
  error: null,
  loading: false,
}

export const useBundlesMetadata = (bundleIds: string[]): MetadataWrapper => {
  const {aggState$: metadataState$} = useBundlesStore()
  const [bundlesMetadata, setBundlesMetadata] = useState<MetadataWrapper['data']>(
    DEFAULT_METADATA_STATE.data,
  )

  const memoObservable = useMemo(() => metadataState$(bundleIds), [metadataState$, bundleIds])

  const observedResult = useObservable(memoObservable) || DEFAULT_METADATA_STATE

  // patch metadata in local state
  useEffect(
    () => setBundlesMetadata((prev) => ({...prev, ...observedResult.data})),
    [observedResult.data],
  )

  return {...observedResult, data: bundlesMetadata}
}
