import {CodeIcon} from '@sanity/icons/Code'
import {DocumentSheetIcon} from '@sanity/icons/DocumentSheet'
import {DownloadIcon} from '@sanity/icons/Download'
import {JsonIcon} from '@sanity/icons/Json'
import {PackageIcon} from '@sanity/icons/Package'
import {Button, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useState} from 'react'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionTab} from '../../store/types'
import * as styles from '../redesign.module.css'
import {downloadFile} from './downloadFile'
import {ExportTypesDialog, type TypesExportFormat} from './ExportTypesDialog'

export interface ResultActionsMenuProps {
  tab: VisionTab
  result: unknown
  hasResult: boolean
  /** Whether the shown result was fetched for the tab's current query and params */
  resultIsCurrent: boolean
  /** Builds the JSON file to download; the item is disabled without it */
  getJsonUrl: (() => string | undefined) | undefined
  /** Builds the CSV file to download; the item is disabled without it */
  getCsvUrl: (() => string | undefined) | undefined
  /** Why there is a result but no CSV file of it, shown under the disabled item */
  csvUnavailableHint?: string
  /** Called when the CSV file could not be built after all */
  onCsvUnavailable: () => void
}

/** The response panel's export menu: the result as a file, or types inferred from it */
export function ResultActionsMenu({
  tab,
  result,
  hasResult,
  resultIsCurrent,
  getJsonUrl,
  getCsvUrl,
  csvUnavailableHint,
  onCsvUnavailable,
}: ResultActionsMenuProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const [exportFormat, setExportFormat] = useState<TypesExportFormat | null>(null)

  const download = (
    getUrl: (() => string | undefined) | undefined,
    filename: string,
    onUnavailable?: () => void,
  ) => {
    const url = getUrl?.()
    if (url) downloadFile(url, filename)
    else onUnavailable?.()
  }

  // MenuItem ellipsizes `text`, so the reason there is no CSV file is a child of the item
  const csvUnavailable = Boolean(csvUnavailableHint) && !getCsvUrl

  return (
    <>
      <MenuButton
        button={
          <Button
            data-testid="vision-result-export-button"
            gap={2}
            icon={DownloadIcon}
            mode="ghost"
            padding={2}
            text={t('vision.result.export')}
          />
        }
        id={`vision-result-export-menu-${tab.id}`}
        menu={
          <Menu data-testid="vision-result-export-menu">
            <MenuItem
              data-testid="vision-export-json"
              disabled={!getJsonUrl}
              icon={JsonIcon}
              onClick={() => download(getJsonUrl, 'query-result.json')}
              text={t('vision.result.export-json')}
            />
            <MenuItem
              className={csvUnavailable ? styles.exportCsvUnavailable : undefined}
              data-testid="vision-export-csv"
              disabled={!getCsvUrl}
              icon={DocumentSheetIcon}
              onClick={() => download(getCsvUrl, 'query-result.csv', onCsvUnavailable)}
              text={t('vision.result.export-csv')}
            >
              {csvUnavailable ? (
                <Text className={styles.exportUnavailableHint} muted size={1}>
                  {csvUnavailableHint}
                </Text>
              ) : null}
            </MenuItem>
            <MenuDivider />
            <MenuItem
              data-testid="vision-export-typescript"
              icon={CodeIcon}
              onClick={() => setExportFormat('typescript')}
              text={t('vision.result.export-typescript')}
            />
            <MenuItem
              data-testid="vision-export-zod"
              icon={PackageIcon}
              onClick={() => setExportFormat('zod')}
              text={t('vision.result.export-zod')}
            />
          </Menu>
        }
        popover={{animate: true, portal: true, placement: 'top-end'}}
      />
      {exportFormat && (
        <ExportTypesDialog
          format={exportFormat}
          hasResult={hasResult}
          onClose={() => setExportFormat(null)}
          result={result}
          resultIsCurrent={resultIsCurrent}
          tab={tab}
        />
      )}
    </>
  )
}
