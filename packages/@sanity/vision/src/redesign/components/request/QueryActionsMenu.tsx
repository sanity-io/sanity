import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CodeIcon} from '@sanity/icons/Code'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {CopyIcon} from '@sanity/icons/Copy'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type QueryRequest, type VisionTab} from '../../store/types'
import {usePendingEdits} from '../../store/VisionActorContext'
import {VISION_SHORTCUTS} from '../../util/shortcuts'
import {ExportQueryDialog} from './ExportQueryDialog'

export interface QueryActionsMenuProps {
  tab: VisionTab
  request: QueryRequest | null
  buildRequest: QueryRequestBuilder['buildRequest']
  resolved: ResolvedRequest
  onCopyQuery: () => void
  onPrettify: () => void
}

export function QueryActionsMenu(props: QueryActionsMenuProps) {
  const {tab, request, buildRequest, resolved, onCopyQuery, onPrettify} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const pendingEdits = usePendingEdits()
  const [exportOpen, setExportOpen] = useState(false)
  const {saveCurrent, canSave} = useSaveCurrentQuery(tab, {request, buildRequest})

  const openExport = useCallback(() => {
    // Params typed within the debounce window belong to the exported request; committing them
    // re-renders the dialog with the request built from them
    pendingEdits.commit()
    setExportOpen(true)
  }, [pendingEdits])

  return (
    <>
      <MenuButton
        button={
          <Button
            aria-label={t('vision.query.actions')}
            data-testid="vision-query-menu-button"
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            padding={2}
          />
        }
        id={`vision-query-menu-${tab.id}`}
        menu={
          <Menu>
            <MenuItem
              hotkeys={VISION_SHORTCUTS['copy-query'].keys}
              icon={CopyIcon}
              onClick={onCopyQuery}
              text={t('vision.query.copy')}
            />
            <MenuItem
              data-testid="vision-prettify"
              hotkeys={VISION_SHORTCUTS.prettify.keys}
              icon={CodeBlockIcon}
              onClick={onPrettify}
              text={t('vision.query.prettify')}
            />
            <MenuDivider />
            <MenuItem
              data-testid="vision-export-query"
              disabled={!request}
              icon={CodeIcon}
              onClick={openExport}
              text={t('vision.query.export')}
            />
            <MenuItem
              data-testid="vision-save-query"
              disabled={!canSave}
              icon={BookmarkIcon}
              onClick={() => void saveCurrent()}
              text={t('vision.query.save')}
            />
          </Menu>
        }
        popover={{animate: true, portal: true, placement: 'top-end'}}
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
