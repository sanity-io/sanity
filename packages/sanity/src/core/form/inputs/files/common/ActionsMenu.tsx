import React, {MouseEventHandler, useCallback} from 'react'

import {UploadIcon, ClipboardIcon, ResetIcon, DownloadIcon} from '@sanity/icons'
import {Box, MenuItem, MenuDivider, Label, useToast} from '@sanity/ui'
import {FileInputMenuItem} from './FileInputMenuItem/FileInputMenuItem'

interface Props {
  onUpload: (files: File[]) => void
  browse: React.ReactNode
  readOnly?: boolean
  onReset: MouseEventHandler<HTMLDivElement>
  accept: string
  directUploads?: boolean
  downloadUrl?: string
  copyUrl?: string
}

export function ActionsMenu(props: Props) {
  const {onUpload, onReset, readOnly, accept, directUploads, browse, downloadUrl, copyUrl} = props

  const {push: pushToast} = useToast()

  const handleCopyURL = useCallback(() => {
    navigator.clipboard.writeText(copyUrl || '')
    pushToast({closable: true, status: 'success', title: 'The URL is copied to the clipboard'})
  }, [pushToast, copyUrl])

  return (
    <>
      <Box padding={2}>
        <Label muted size={1}>
          Replace
        </Label>
      </Box>
      <FileInputMenuItem
        icon={UploadIcon}
        mode="bleed"
        onSelect={onUpload}
        accept={accept}
        text="Upload"
        data-testid="file-input-upload-button"
        disabled={readOnly || !directUploads}
        fontSize={2}
      />
      {browse}

      {(downloadUrl || copyUrl) && <MenuDivider />}
      {downloadUrl && <MenuItem as="a" icon={DownloadIcon} text="Download" href={downloadUrl} />}
      {copyUrl && <MenuItem icon={ClipboardIcon} text="Copy URL" onClick={handleCopyURL} />}

      <MenuDivider />
      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text="Clear field"
        onClick={onReset}
        disabled={readOnly}
        data-testid="file-input-clear"
      />
    </>
  )
}
