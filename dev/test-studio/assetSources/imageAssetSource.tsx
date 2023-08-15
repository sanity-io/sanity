import {ImagesIcon} from '@sanity/icons'
import {AssetSource, AssetSourceComponentProps} from '@sanity/types'
import {Box, Dialog, Text} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {clearAllBodyScrollLocks, disableBodyScroll} from 'sanity'

function ImageAssetSource(props: AssetSourceComponentProps) {
  const {dialogHeaderTitle, onClose, ...restProps} = props
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)

  //Avoid background of dialog being scrollable on mobile
  if (documentScrollElement) {
    disableBodyScroll(documentScrollElement)
  }

  const handleOnClose = useCallback(() => {
    onClose()
    clearAllBodyScrollLocks()
  }, [onClose])

  return (
    <Dialog
      header={dialogHeaderTitle || 'Custom: browse images'}
      id="test"
      onClose={handleOnClose}
      onClickOutside={handleOnClose}
      width={1}
      contentRef={setDocumentScrollElement}
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
