import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {tap} from 'rxjs'
import {useBundlesStore} from 'sanity'

type BundlesMetadata = {matches: number; lastEdited: string}

export type BundlesMetadataMap = Record<string, BundlesMetadata>

export const useBundlesMetadata = (
  bundleIds: string[],
): {
  bundlesMetadata: BundlesMetadataMap
  loading: boolean
  error: null
} => {
  const {aggState$} = useBundlesStore()
  const [aggState, setAggState] = useState<BundlesMetadataMap>()

  const memoObservable = useMemo(
    () => aggState$(bundleIds).pipe(tap(setAggState)),
    [aggState$, bundleIds],
  )

  useObservable(memoObservable)

  return useMemo(
    () => ({
      bundlesMetadata: aggState || {},
      loading: false,
      error: null,
    }),
    [aggState],
  )
}
