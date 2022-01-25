import React, {ReactNode} from 'react'
import {Observable} from 'rxjs'
import {Reference} from '@sanity/types'
import {useMemoObservable} from 'react-rx'

interface Props<AssetDoc> {
  reference: Reference
  observeAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
  waitPlaceholder?: ReactNode
}

export function WithReferencedAsset<Asset>(props: Props<Asset>) {
  const {reference, children, observeAsset, waitPlaceholder} = props
  const documentId = reference?._ref
  const asset = useMemoObservable(() => observeAsset(documentId), [documentId])
  return <>{documentId && asset ? children(asset) : waitPlaceholder}</>
}
