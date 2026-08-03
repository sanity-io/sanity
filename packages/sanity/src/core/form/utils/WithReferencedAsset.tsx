import {type Reference} from '@sanity/types'
import {type ReactNode, useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {type Observable} from 'rxjs'

interface Props<AssetDoc> {
  reference: Reference
  observeAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
  waitPlaceholder?: ReactNode
}

export function WithReferencedAsset<Asset>(props: Props<Asset>) {
  const {reference, children, observeAsset, waitPlaceholder} = props
  const documentId = reference?._ref
  const observable = useMemo(() => observeAsset(documentId), [documentId, observeAsset])
  // Kept synchronous: the render gates on the live `documentId`, so a deferred
  // snapshot could hand `children` the previous asset after the reference
  // changes to a new document.
  const asset = useSyncObservable(observable)
  return <>{documentId && asset ? children(asset) : waitPlaceholder}</>
}
