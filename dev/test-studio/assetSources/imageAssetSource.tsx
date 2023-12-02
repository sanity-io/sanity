import {ImagesIcon} from '@sanity/icons'
import {AssetSource, AssetSourceComponentProps} from '@sanity/types'
import {Text} from '@sanity/ui'
import {Dialog} from '../../../packages/sanity/src/ui'

function ImageAssetSource(props: AssetSourceComponentProps) {
  const {dialogHeaderTitle, onClose} = props

  return (
    <Dialog
      header={dialogHeaderTitle || 'Custom: browse images'}
      id="test"
      onClose={onClose}
      width={1}
    >
      <Text muted size={1} weight="medium">
        (custom image asset source)
      </Text>
    </Dialog>
  )
}

export const imageAssetSource: AssetSource = {
  name: 'test',
  title: 'Test',
  icon: ImagesIcon,
  component: ImageAssetSource,
}
