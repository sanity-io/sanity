import {get} from 'lodash'
import React, {MouseEventHandler} from 'react'

import {SearchIcon, UploadIcon, ClipboardIcon, ResetIcon, DownloadIcon} from '@sanity/icons'
import {Text, Menu, Box, MenuItem, MenuDivider, Label} from '@sanity/ui'
import {FileAsset} from '@sanity/types/src'
import {FileInputButton} from './FileInputButton/FileInputButton'

interface Props {
  onUpload: (files: File[]) => void
  onBrowse: MouseEventHandler<HTMLDivElement>
  readOnly: boolean
  assetDocument: FileAsset
  onReset: MouseEventHandler<HTMLDivElement>
  accept: string
}

export function OptionsMenu(props: Props) {
  const {onUpload, onBrowse, onReset, readOnly, assetDocument, accept} = props

  return (
    <Menu>
      <Box padding={2}>
        <Label muted size={1}>
          Replace
        </Label>
      </Box>
      <FileInputButton
        icon={UploadIcon}
        mode="ghost"
        onSelect={onUpload}
        accept={accept}
        text="Upload"
        data-testid="file-input-upload-button"
        disabled={readOnly}
        fromMenu
      />
      <MenuItem icon={SearchIcon} text="Browse" onClick={onBrowse} disabled={readOnly} />
      <MenuDivider />
      <MenuItem as="a" icon={DownloadIcon} text="Download file" href={`${assetDocument.url}?dl`} />
      <MenuItem
        icon={ClipboardIcon}
        text="Copy URL"
        onClick={() => {
          navigator.clipboard.writeText(assetDocument.url)
        }}
      />

      <MenuDivider />
      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text="Clear field"
        onClick={onReset}
        disabled={readOnly}
      />
    </Menu>
  )
}
