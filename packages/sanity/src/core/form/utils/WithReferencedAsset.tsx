import {type Reference} from '@sanity/types'
import {type ReactNode} from 'react'
import {useMemoObservable} from 'react-rx'
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
  const asset = useMemoObservable(() => observeAsset(documentId), [documentId, observeAsset])
  return <>{documentId && asset ? children(asset) : waitPlaceholder}</>
}
