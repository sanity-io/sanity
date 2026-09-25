import {CodeIcon} from '@sanity/icons/Code'
import {CopyIcon} from '@sanity/icons/Copy'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PackageIcon} from '@sanity/icons/Package'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useState} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type VistaTab} from '../../store/types'
import {ExportTypesDialog, type TypesExportFormat} from './ExportTypesDialog'

export interface ResultActionsMenuProps {
  tab: VistaTab
  result: unknown
  hasResult: boolean
  /** Whether the shown result was fetched for the tab's current query and params */
  resultIsCurrent: boolean
}

export function ResultActionsMenu({
  tab,
  result,
  hasResult,
  resultIsCurrent,
}: ResultActionsMenuProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const [exportFormat, setExportFormat] = useState<TypesExportFormat | null>(null)

  return (
    <>
      <MenuButton
        button={
          <Button
            aria-label={t('vista.result.actions')}
            data-testid="vista-result-menu-button"
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            padding={2}
          />
        }
        id={`vista-result-menu-${tab.id}`}
        menu={
          <Menu>
            <MenuItem
              disabled={!hasResult}
              icon={CopyIcon}
              onClick={() =>
                void copyToClipboard(JSON.stringify(result, null, 2), t('vista.result.copied'))
              }
              text={t('vista.result.copy')}
            />
            <MenuDivider />
            <MenuItem
              data-testid="vista-export-typescript"
              icon={CodeIcon}
              onClick={() => setExportFormat('typescript')}
              text={t('vista.result.export-typescript')}
            />
            <MenuItem
              data-testid="vista-export-zod"
              icon={PackageIcon}
              onClick={() => setExportFormat('zod')}
              text={t('vista.result.export-zod')}
            />
          </Menu>
        }
        popover={{portal: true, placement: 'left-start'}}
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
