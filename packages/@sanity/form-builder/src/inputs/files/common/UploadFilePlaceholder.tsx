import React, {MouseEventHandler} from 'react'
import {UploadIcon, SearchIcon, BinaryDocumentIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text, Button, Inline} from '@sanity/ui'
import {get} from 'lodash'
import {FileInputButton} from './FileInputButton/FileInputButton'

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
  const accept = get('file', 'options.accept', 'image/*')
  return (
    <Flex
      align="center"
      justify="space-between"
      gap={[3, 4, 4]}
      direction={['column-reverse', 'column-reverse', 'row']}
      paddingY={[0, 2, 2]}
    >
      <Inline space={2}>
        <Flex justify="center">
          <Text muted>
            <Text muted>{readOnly ? <ReadOnlyIcon /> : <BinaryDocumentIcon />}</Text>
          </Text>
        </Flex>
        <Flex justify="center">
          <Text size={1} muted>
            {readOnly ? 'Read only' : 'Drag or paste file here'}
          </Text>
        </Flex>
      </Inline>
      <Inline space={2}>
        <FileInputButton
          icon={UploadIcon}
          mode="ghost"
          onSelect={onUpload}
          accept={accept}
          text="Upload"
          data-testid="file-input-upload-button"
          disabled={readOnly}
        />
        <Button
          fontSize={2}
          text="Browse"
          icon={SearchIcon}
          mode="ghost"
          onClick={onBrowse}
          data-testid="file-input-select-button"
          disabled={readOnly}
        />
      </Inline>
    </Flex>
  )
})
