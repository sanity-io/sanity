import React, {MouseEventHandler} from 'react'
import {UploadIcon, SearchIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text, Button, Inline, Stack} from '@sanity/ui'
import {get} from 'lodash'
import {FileInputButton} from '../common/FileInputButton/FileInputButton'

type UploadPlaceholderProps = {
  onUpload?: (files: File[]) => void
  onBrowse?: MouseEventHandler<HTMLButtonElement>
  readOnly?: boolean | null
}

export default React.memo(function UploadImagePlaceholder({
  onBrowse,
  onUpload,
  readOnly,
}: UploadPlaceholderProps) {
  const accept = get('image', 'options.accept', 'image/*')
  return (
    <Flex height="fill" align="center" justify="center">
      <Stack space={4}>
        <Stack space={3}>
          <Flex justify="center">
            <Text muted>{readOnly ? <ReadOnlyIcon /> : <ImageIcon />}</Text>
          </Flex>
          <Flex justify="center">
            <Text size={1} muted>
              {readOnly ? 'Read only' : 'Drag or paste image here'}
            </Text>
          </Flex>
        </Stack>
        <Inline space={2}>
          <FileInputButton
            icon={UploadIcon}
            mode="ghost"
            onSelect={onUpload}
            accept={accept}
            text="Upload"
            data-testid="image-input-upload-button"
            disabled={readOnly}
          />
          <Button
            fontSize={2}
            text="Browse"
            icon={SearchIcon}
            mode="ghost"
            onClick={onBrowse}
            data-testid="image-input-select-button"
            disabled={readOnly}
          />
        </Inline>
      </Stack>
    </Flex>
  )
})
