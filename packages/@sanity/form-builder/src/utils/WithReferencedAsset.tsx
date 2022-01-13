import React, {ReactNode} from 'react'
import {Observable} from 'rxjs'
import {Reference} from '@sanity/types'
import {useMemoObservable} from 'react-rx'

interface Props<AssetDoc> {
  reference?: Reference
  getAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
}

export function WithReferencedAsset<Asset>(props: Props<Asset>) {
  const {reference, children, getAsset} = props
  const documentId = reference?._ref
  const asset = useMemoObservable(() => getAsset(documentId), [documentId])
  return <>{documentId ? children(asset) : null}</>
}
