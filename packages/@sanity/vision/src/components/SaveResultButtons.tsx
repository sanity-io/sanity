import {DocumentSheetIcon} from '@sanity/icons'
import {Button, Tooltip} from '@sanity/ui'
import {type MouseEvent} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'

interface SaveButtonProps {
  blobUrl: string | undefined
}

function preventSave(evt: MouseEvent<HTMLButtonElement>) {
  return evt.preventDefault()
}

export function SaveCsvButton({blobUrl}: SaveButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const isDisabled = !blobUrl

  const button = (
    <Button
      as="a"
      disabled={isDisabled}
      download={isDisabled ? undefined : 'query-result.csv'}
      href={blobUrl}
      icon={DocumentSheetIcon}
      mode="ghost"
      onClick={isDisabled ? preventSave : undefined}
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="CSV" // String is a File extension
      tone="default"
    />
  )

  return isDisabled ? (
    <Tooltip content={t('result.save-result-as-csv.not-csv-encodable')} placement="top">
      {button}
    </Tooltip>
  ) : (
    button
  )
}

export function SaveJsonButton({blobUrl}: SaveButtonProps) {
  return (
    <Button
      as="a"
      download={'query-result.json'}
      href={blobUrl}
      icon={DocumentSheetIcon}
      mode="ghost"
      // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="JSON" // String is a File extension
      tone="default"
    />
  )
}
