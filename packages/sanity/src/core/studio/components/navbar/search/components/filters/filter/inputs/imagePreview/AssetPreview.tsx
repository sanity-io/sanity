import {BinaryDocumentIcon} from '@sanity/icons'
import type {Asset} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {formatBytes} from '../../../../../../../../../form/inputs/common/helper'

interface AssetPreviewProps {
  asset: Asset
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

export function AssetPreview({asset}: AssetPreviewProps) {
  if (!asset) {
    return null
  }
  if (asset._type.startsWith('sanity.fileAsset')) {
    return (
      <Card padding={2} shadow={1}>
        <Flex wrap="nowrap" justify="space-between" align="center">
          <Card padding={3} radius={1} shadow={1} tone="transparent">
            <Text>
              <BinaryDocumentIcon />
            </Text>
          </Card>
          <Stack flex={1} space={2} marginLeft={3}>
            <Text size={2} textOverflow="ellipsis" muted>
              {asset?.originalFilename || asset._id}
            </Text>
            <Text size={1} muted>
              {formatBytes(asset.size)}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }

  if (asset._type.startsWith('sanity.imageAsset')) {
    const imageUrl = `${asset.url}?h=800&fit=max`
    return (
      <Container __unstable_checkered border>
        <Image src={imageUrl} />
      </Container>
    )
  }

  return null
}
