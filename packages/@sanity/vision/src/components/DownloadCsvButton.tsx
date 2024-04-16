import {DocumentSheetIcon} from '@sanity/icons'
import {Button, Tooltip} from '@sanity/ui'
import {type MouseEvent} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'

function preventDownload(evt: MouseEvent<HTMLButtonElement>) {
  return evt.preventDefault()
}

export function DownloadCsvButton({csvUrl}: {csvUrl: string | undefined}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const isDisabled = !csvUrl

  const button = (
    <Button
      as="a"
      disabled={isDisabled}
      download={isDisabled ? undefined : 'query-result.csv'}
      href={csvUrl}
      icon={DocumentSheetIcon}
      mode="ghost"
      onClick={isDisabled ? preventDownload : undefined}
      text={t('action.download-result-as-csv')}
      tone="default"
    />
  )

  return isDisabled ? (
    <Tooltip content={t('action.download-result-as-csv.not-csv-encodable')} placement="top">
      {button}
    </Tooltip>
  ) : (
    button
  )
}
