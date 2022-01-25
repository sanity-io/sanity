import React, {ReactNode} from 'react'
import {Observable} from 'rxjs'
import {Reference} from '@sanity/types'
import {useMemoObservable} from 'react-rx'
import {Box, Spinner} from '@sanity/ui'

interface Props<AssetDoc> {
  reference: Reference
  observeAsset: (assetId: string) => Observable<AssetDoc>
  children: (assetDocument: AssetDoc) => ReactNode
}

export function WithReferencedAsset<Asset>(props: Props<Asset>) {
  const {reference, children, observeAsset} = props
  const documentId = reference?._ref
  const asset = useMemoObservable(() => observeAsset(documentId), [documentId])
  return (
    <>
      {documentId && asset ? (
        children(asset)
      ) : (
        <Box padding={2}>
          <Spinner muted />
        </Box>
      )}
    </>
  )
}
