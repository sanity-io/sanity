import {useEffect, useState} from 'react'
import type {Reference} from '@sanity/types'
import {tap} from 'rxjs/operators'
import type {Observable} from 'rxjs'

type SnapshotState = {
  isLoading: boolean
  snapshot: null | PreviewSnapshot
}

const LOADING_SNAPSHOT: SnapshotState = {
  isLoading: true,
  snapshot: null,
}

const NULL_SNAPSHOT: SnapshotState = {
  isLoading: false,
  snapshot: null,
}

// TODO: unify types with `@sanity/base`
// see `PreparedValue` in `prepareForPreview`
type PreviewSnapshot = {
  _id: string
  _type: string
  title: string
  description: string
  _internalMeta?: {type?: string}
}

export function usePreviewSnapshot(
  value: Reference | undefined,
  getPreviewSnapshot: (reference: Reference) => Observable<PreviewSnapshot | null>
): SnapshotState {
  const [state, setState] = useState<SnapshotState>(LOADING_SNAPSHOT)

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (value?._ref) {
      setState(LOADING_SNAPSHOT)
      const sub = getPreviewSnapshot(value)
        .pipe(tap((snapshot) => setState({isLoading: false, snapshot})))
        .subscribe()
      return () => {
        sub.unsubscribe()
      }
    }
    setState(NULL_SNAPSHOT)
  }, [getPreviewSnapshot, value])
  return state
}
