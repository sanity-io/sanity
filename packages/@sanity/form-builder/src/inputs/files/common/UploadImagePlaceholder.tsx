import React, {MouseEventHandler} from 'react'
import {UploadIcon, SearchIcon} from '@sanity/icons'
import {Flex, Button, Inline, Stack} from '@sanity/ui'
import {get} from 'lodash'
import {FileInputButton} from '../common/FileInputButton/FileInputButton'
import {FileLike, UploaderResolver} from '../../../sanity/uploads/types'
import {PlaceholderText} from './PlaceholderText'

type UploadPlaceholderProps = {
  onUpload?: (files: File[]) => void
  onBrowse?: MouseEventHandler<HTMLButtonElement>
  readOnly?: boolean | null
  type: string
  hoveringFiles: FileLike[]

  acceptedFiles: FileLike[]
  rejectedFilesCount: number
}

export default React.memo(function UploadImagePlaceholder({
  onBrowse,
  onUpload,
  readOnly,
  hoveringFiles,
  acceptedFiles,
  rejectedFilesCount,
  type,
}: UploadPlaceholderProps) {
  const accept = get('image', 'options.accept', 'image/*')
  return (
    <Flex height="fill" align="center" justify="center">
      <Stack space={4}>
        <Stack space={3}>
          <PlaceholderText
            readOnly={readOnly}
            hoveringFiles={hoveringFiles}
            acceptedFiles={acceptedFiles}
            rejectedFilesCount={rejectedFilesCount}
            type={type}
          />
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
