import {
  SanityFormBuilderAssetSourceComponent,
  SanityFormBuilderAssetSourceConfig,
} from '@sanity/base'
import {ImagesIcon} from '@sanity/icons'
import {Box, Dialog} from '@sanity/ui'
import React from 'react'

const ImageAssetSource: SanityFormBuilderAssetSourceComponent = (props) => {
  const {dialogHeaderTitle} = props

  return (
    <Dialog header={dialogHeaderTitle} id="test">
      <Box padding={4}>ImageAssetSource</Box>
    </Dialog>
  )
}

export const imageAssetSource: SanityFormBuilderAssetSourceConfig = {
  type: 'image',
  name: 'test',
  title: 'Test',
  icon: ImagesIcon,
  component: ImageAssetSource,
}
