import {CopyIcon, DownloadIcon, LaunchIcon, ResetIcon} from '@sanity/icons'
import {MenuDivider, useToast} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, useCallback} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

interface Props {
  browse: ReactNode
  readOnly?: boolean
  onReset: MouseEventHandler<HTMLDivElement>
  downloadUrl?: string
  copyUrl?: string
  openInSource?: () => void
  openInSourceName?: string
  upload: ReactNode
}

export function ActionsMenu(props: Props) {
  const {onReset, readOnly, browse, downloadUrl, copyUrl, openInSource, openInSourceName, upload} =
    props

  const {push: pushToast} = useToast()
  const {t} = useTranslation()

  const handleCopyURL = useCallback(() => {
    void navigator.clipboard.writeText(copyUrl || '')
    pushToast({
      closable: true,
      status: 'success',
      title: t('inputs.files.common.actions-menu.notification.url-copied'),
    })
  }, [copyUrl, pushToast, t])

  return (
    <>
      {upload}
      {upload && browse && <MenuDivider />}
      {browse}

      {(downloadUrl || copyUrl || openInSource) && <MenuDivider />}
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

      {openInSource && (
        <MenuItem
          icon={LaunchIcon}
          text={t('inputs.files.common.actions-menu.open-in-source.label', {
            sourceName: openInSourceName || 'source',
          })}
          onClick={openInSource}
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
