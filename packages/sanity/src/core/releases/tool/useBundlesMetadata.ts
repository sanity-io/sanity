import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {tap} from 'rxjs'
import {useBundlesStore} from 'sanity'

import {type MetadataWrapper} from '../../store/bundles/createBundlesStore'

type BundlesMetadata = {matches: number; lastEdited: string}

export type BundlesMetadataMap = Record<string, BundlesMetadata>

export const useBundlesMetadata = (bundleIds: string[]): MetadataWrapper => {
  const {aggState$} = useBundlesStore()
  const [aggState, setAggState] = useState<MetadataWrapper>({
    data: null,
    error: null,
    loading: false,
  })

  const memoObservable = useMemo(
    () => aggState$(bundleIds).pipe(tap(setAggState)),
    [aggState$, bundleIds],
  )

  useObservable(memoObservable)

  return aggState

  return useMemo(
    () => ({
      bundlesMetadata: aggState?.data || {},
      loading: false,
      error: null,
    }),
    [aggState],
  )
}
