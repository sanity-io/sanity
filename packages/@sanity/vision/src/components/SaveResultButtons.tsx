import {DocumentSheetIcon} from '@sanity/icons/DocumentSheet'
import {Button, Tooltip} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'

interface SaveButtonProps {
  blobUrl: string | undefined
}

export function SaveCsvButton({blobUrl}: SaveButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)

  // An anchor cannot be disabled, so when there is nothing to download we render a plain
  // disabled button (which also prevents the click natively) instead of a disabled link.
  if (!blobUrl) {
    return (
      <Tooltip content={t('result.save-result-as-csv.not-csv-encodable')} placement="top">
        <Button
          disabled
          icon={DocumentSheetIcon}
          mode="ghost"
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text="CSV" // String is a File extension
          tone="default"
        />
      </Tooltip>
    )
  }

  return (
    <Button
      as="a"
      download="query-result.csv"
      href={blobUrl}
      icon={DocumentSheetIcon}
      mode="ghost"
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="CSV" // String is a File extension
      tone="default"
    />
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
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
      text="JSON" // String is a File extension
      tone="default"
    />
  )
}
