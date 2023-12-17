import React, {MouseEventHandler, useCallback} from 'react'

import {UploadIcon, CopyIcon, ResetIcon, DownloadIcon} from '@sanity/icons'
import {MenuDivider, useToast} from '@sanity/ui'
import {MenuItem} from '../../../../ui-components'
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
      <FileInputMenuItem
        icon={UploadIcon}
        onSelect={onUpload}
        accept={accept}
        text={t('inputs.files.common.actions-menu.upload.label')}
        data-testid="file-input-upload-button"
        disabled={readOnly || !directUploads}
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
