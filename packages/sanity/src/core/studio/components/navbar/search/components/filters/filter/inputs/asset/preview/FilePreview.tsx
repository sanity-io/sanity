import {BinaryDocumentIcon} from '@sanity/icons'
import type {Asset} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {formatBytes} from '../../../../../../../../../../form/inputs/common/helper'

export function FilePreview({asset}: {asset: Asset}) {
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
