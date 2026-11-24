import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CodeIcon} from '@sanity/icons/Code'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type QueryRequest, type VisionTab} from '../../store/types'
import {usePendingEdits} from '../../store/VisionActorContext'
import {cx} from '../../util/cx'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'
import {VisionTooltip} from '../VisionTooltip'
import {ExportQueryDialog} from './ExportQueryDialog'

export interface QueryActionsMenuProps {
  tab: VisionTab
  request: QueryRequest | null
  buildRequest: QueryRequestBuilder['buildRequest']
  resolved: ResolvedRequest
}

/**
 * The "More actions" menu in the query pane's toolbar, next to Copy: export or save the query
 */
export function QueryActionsMenu(props: QueryActionsMenuProps) {
  const {tab, request, buildRequest, resolved} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const pendingEdits = usePendingEdits()
  const [exportOpen, setExportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const moreActions = t('vision.actions.more')
  const {saveCurrent, canSave} = useSaveCurrentQuery(tab, {request, buildRequest})

  const openExport = useCallback(() => {
    // Params typed within the debounce window belong to the exported request; committing them
    // re-renders the dialog with the request built from them
    pendingEdits.commit()
    setExportOpen(true)
  }, [pendingEdits])

  return (
    <>
      <VisionTooltip
        content={moreActions}
        // The tooltip would cover the menu it names
        disabled={menuOpen}
        placement="top"
      >
        {/* The tooltip attaches to this wrapper, which leaves the button's ref to the menu */}
        <span className={styles.tooltipTarget} data-testid="vision-query-menu-tooltip-target">
          <MenuButton
            button={
              <Button
                aria-label={t('vision.query.actions')}
                data-testid="vision-query-menu-button"
                fontSize={1}
                icon={EllipsisHorizontalIcon}
                mode="bleed"
                padding={2}
              />
            }
            id={`vision-query-menu-${tab.id}`}
            menu={
              <Menu className={cx(styles.popoverScroll, themeStyles.themeTokens)}>
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
            onClose={() => setMenuOpen(false)}
            onOpen={() => setMenuOpen(true)}
            popover={{animate: true, portal: true, placement: 'bottom-end'}}
          />
        </span>
      </VisionTooltip>
      {exportOpen && request && (
        <ExportQueryDialog
          onClose={() => setExportOpen(false)}
          request={request}
          resolved={resolved}
        />
      )}
    </>
  )
}
