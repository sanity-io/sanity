import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CodeIcon} from '@sanity/icons/Code'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {CopyIcon} from '@sanity/icons/Copy'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {SyncIcon} from '@sanity/icons/Sync'
import {Button, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'
import {useState} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type QueryRequest, type VistaTab} from '../../store/types'
import {VISTA_SHORTCUTS} from '../../util/shortcuts'
import {ExportQueryDialog} from './ExportQueryDialog'

export interface QueryActionsMenuProps {
  tab: VistaTab
  request: QueryRequest | null
  resolved: ResolvedRequest
  onCopyQuery: () => void
  onPrettify: () => void
  onToggleAutoRefetch: () => void
}

export function QueryActionsMenu(props: QueryActionsMenuProps) {
  const {tab, request, resolved, onCopyQuery, onPrettify, onToggleAutoRefetch} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const [exportOpen, setExportOpen] = useState(false)
  const {saveCurrent, canSave} = useSaveCurrentQuery(tab, request)

  const autoRefetchItem = (
    <MenuItem
      data-testid="vista-auto-refetch"
      disabled={!resolved.supportsSyncTags}
      icon={SyncIcon}
      iconRight={tab.autoRefetch && resolved.supportsSyncTags ? CheckmarkIcon : undefined}
      onClick={onToggleAutoRefetch}
      pressed={tab.autoRefetch && resolved.supportsSyncTags}
      text={t('vista.query.auto-refetch')}
    />
  )

  return (
    <>
      <MenuButton
        button={
          <Button
            aria-label={t('vista.query.actions')}
            data-testid="vista-query-menu-button"
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            padding={2}
          />
        }
        id={`vista-query-menu-${tab.id}`}
        menu={
          <Menu>
            <MenuItem
              hotkeys={VISTA_SHORTCUTS['copy-query'].keys}
              icon={CopyIcon}
              onClick={onCopyQuery}
              text={t('vista.query.copy')}
            />
            <MenuItem
              data-testid="vista-prettify"
              hotkeys={VISTA_SHORTCUTS.prettify.keys}
              icon={CodeBlockIcon}
              onClick={onPrettify}
              text={t('vista.query.prettify')}
            />
            <MenuDivider />
            {resolved.supportsSyncTags ? (
              autoRefetchItem
            ) : (
              <Tooltip
                content={<Text size={1}>{t('vista.query.auto-refetch.unsupported')}</Text>}
                placement="left"
                portal
              >
                <div>{autoRefetchItem}</div>
              </Tooltip>
            )}
            <MenuDivider />
            <MenuItem
              data-testid="vista-export-query"
              disabled={!request}
              icon={CodeIcon}
              onClick={() => setExportOpen(true)}
              text={t('vista.query.export')}
            />
            <MenuItem
              data-testid="vista-save-query"
              disabled={!canSave}
              icon={BookmarkIcon}
              onClick={() => void saveCurrent()}
              text={t('vista.query.save')}
            />
          </Menu>
        }
        popover={{portal: true, placement: 'left-start'}}
      />
      {exportOpen && request && (
        <ExportQueryDialog
          onClose={() => setExportOpen(false)}
          request={request}
          resolved={resolved}
          tab={tab}
        />
      )}
    </>
  )
}
