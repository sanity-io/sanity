import {SanityAsset} from '@sanity/asset-utils'
import {Card} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

interface ImagePreviewProps {
  asset: SanityAsset
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

export function AssetImagePreview({asset}: ImagePreviewProps) {
  if (!asset) {
    return null
  }

  const imageUrl = `${asset.url}?h=800&fit=max`
  return (
    <Container __unstable_checkered border>
      <Image src={imageUrl} />
    </Container>
  )
}
