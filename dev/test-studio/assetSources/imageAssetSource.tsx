import {ImagesIcon} from '@sanity/icons'
import {type AssetSource, type AssetSourceComponentProps} from '@sanity/types'
import {Box, Dialog, Text} from '@sanity/ui'

function ImageAssetSource(props: AssetSourceComponentProps) {
  const {dialogHeaderTitle, onClose, ...restProps} = props

  return (
    <Dialog
      header={dialogHeaderTitle || 'Custom: browse images'}
      id="test"
      onClose={onClose}
      width={1}
    >
      <Box padding={4}>
        <Text muted size={1} weight="medium">
          (custom image asset source)
        </Text>
      </Box>
    </Dialog>
  )
}

export const imageAssetSource: AssetSource = {
  name: 'test',
  title: 'Test',
  icon: ImagesIcon,
  component: ImageAssetSource,
}
