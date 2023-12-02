import type {ImageAsset, ReferenceValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {observeImageAsset} from '../../../../../../../../../../form/studio/inputs/client-adapters/assets'
import {WithReferencedAsset} from '../../../../../../../../../../form/utils/WithReferencedAsset'
import {useDocumentPreviewStore} from '../../../../../../../../../../store'
import {LoadingBlock} from '../../../../../../../../../../../ui/loadingBlock'

interface ImageReferencePreviewProps {
  reference: ReferenceValue
}

const Container = styled(Card)`
  position: relative;
  padding-bottom: 100%;
`

const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
`

export function ImageReferencePreview({reference}: ImageReferencePreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observeAsset = useCallback(
    (id: string) => observeImageAsset(documentPreviewStore, id),
    [documentPreviewStore],
  )
  return (
    <WithReferencedAsset observeAsset={observeAsset} reference={reference}>
      {(asset) => <ImagePreview asset={asset} />}
    </WithReferencedAsset>
  )
}

function ImagePreview({asset}: {asset: ImageAsset}) {
  const [loaded, setLoaded] = useState(false)
  const imageUrl = `${asset.url}?h=800&fit=max`
  const handleLoad = useCallback(() => setLoaded(true), [])

  return (
    <Container __unstable_checkered border>
      {!loaded && <LoadingBlock fill />}
      <Image onLoad={handleLoad} src={imageUrl} />
    </Container>
  )
}
