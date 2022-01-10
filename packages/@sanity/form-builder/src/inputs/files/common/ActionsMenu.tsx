import React, {MouseEventHandler, useCallback} from 'react'

import {UploadIcon, ClipboardIcon, ResetIcon, DownloadIcon} from '@sanity/icons'
import {Box, MenuItem, MenuDivider, Label, useToast} from '@sanity/ui'
import {FileAsset} from '@sanity/types/src'
import {FileInputButton} from './FileInputButton/FileInputButton'

interface Props {
  onUpload: (files: File[]) => void
  browse: React.ReactNode
  readOnly: boolean
  assetDocument: FileAsset
  onReset: MouseEventHandler<HTMLDivElement>
  accept: string
  directUploads: boolean
}

export function ActionsMenu(props: Props) {
  const {onUpload, onReset, readOnly, assetDocument, accept, directUploads, browse} = props

  const {push: pushToast} = useToast()

  const handleCopyURL = useCallback(() => {
    navigator.clipboard.writeText(assetDocument.url)
    pushToast({closable: true, status: 'success', title: 'The url is copied to the clipboard'})
  }, [pushToast, assetDocument])

  return (
    <>
      <Box padding={2}>
        <Label muted size={1}>
          Replace
        </Label>
      </Box>
      <FileInputButton
        icon={UploadIcon}
        mode="bleed"
        onSelect={onUpload}
        accept={accept}
        text="Upload"
        data-testid="file-input-upload-button"
        disabled={readOnly || !directUploads}
        fontSize={2}
        fromMenu
      />
      {browse}

      <MenuDivider />
      <MenuItem as="a" icon={DownloadIcon} text="Download file" href={`${assetDocument.url}?dl`} />
      <MenuItem icon={ClipboardIcon} text="Copy URL" onClick={handleCopyURL} />

      <MenuDivider />
      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text="Clear field"
        onClick={onReset}
        disabled={readOnly}
      />
    </>
  )
}
