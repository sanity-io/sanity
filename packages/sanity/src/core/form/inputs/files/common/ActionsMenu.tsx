import React, {MouseEventHandler, useCallback} from 'react'

import {UploadIcon, CopyIcon, ResetIcon, DownloadIcon} from '@sanity/icons'
import {Box, MenuItem, MenuDivider, Label, useToast} from '@sanity/ui'
import {useTranslation} from '../../../../i18n'
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
  const {t} = useTranslation()

  const handleCopyURL = useCallback(() => {
    navigator.clipboard.writeText(copyUrl || '')
    pushToast({
      closable: true,
      status: 'success',
      title: t('inputs.files.common.actions-menu.notification.url-copied'),
    })
  }, [copyUrl, pushToast, t])

  return (
    <>
      <Box padding={2}>
        <Label muted size={1}>
          {t('inputs.files.common.actions-menu.replace.label')}
        </Label>
      </Box>
      <FileInputMenuItem
        icon={UploadIcon}
        mode="bleed"
        onSelect={onUpload}
        accept={accept}
        text={t('inputs.files.common.actions-menu.upload.label')}
        data-testid="file-input-upload-button"
        disabled={readOnly || !directUploads}
        fontSize={2}
      />
      {browse}

      {(downloadUrl || copyUrl) && <MenuDivider />}
      {downloadUrl && (
        <MenuItem
          as="a"
          icon={DownloadIcon}
          text={t('inputs.files.common.actions-menu.download.label')}
          href={downloadUrl}
        />
      )}
      {copyUrl && (
        <MenuItem
          icon={CopyIcon}
          text={t('inputs.files.common.actions-menu.copy-url.label')}
          onClick={handleCopyURL}
        />
      )}

      <MenuDivider />
      <MenuItem
        tone="critical"
        icon={ResetIcon}
        text={t('inputs.files.common.actions-menu.clear-field.label')}
        onClick={onReset}
        disabled={readOnly}
        data-testid="file-input-clear"
      />
    </>
  )
}
