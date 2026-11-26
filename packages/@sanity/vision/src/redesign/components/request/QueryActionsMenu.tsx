import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CodeIcon} from '@sanity/icons/Code'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {UsersIcon} from '@sanity/icons/Users'
import {Button, Dialog} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex, Text} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {useShareTab} from '../../hooks/useShareTab'
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
 * The "More actions" menu in the query pane's toolbar, next to Copy: export or save the query,
 * or share the tab
 */
export function QueryActionsMenu(props: QueryActionsMenuProps) {
  const {tab, request, buildRequest, resolved} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const pendingEdits = usePendingEdits()
  const telemetry = useVisionTelemetry()
  const [exportOpen, setExportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const moreActions = t('vision.actions.more')
  const {saveCurrent, canSave} = useSaveCurrentQuery(tab, {request, buildRequest})
  const shareTab = useShareTab(tab, {request, buildRequest, resolved})

  const openExport = useCallback(() => {
    // Params typed within the debounce window belong to the exported request; committing them
    // re-renders the dialog with the request built from them
    pendingEdits.commit()
    telemetry.dialogOpened('export-query')
    setExportOpen(true)
  }, [pendingEdits, telemetry])

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
              <Menu
                className={cx(styles.popoverScroll, themeStyles.themeTokens)}
                data-testid="vision-query-menu"
              >
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
                {shareTab.canShare && (
                  <MenuItem
                    data-testid="vision-share-tab"
                    disabled={!shareTab.shareEnabled}
                    icon={UsersIcon}
                    onClick={shareTab.share}
                    text={t('vision.tabs.share')}
                  />
                )}
                {shareTab.sharedQuery && (
                  <MenuItem
                    data-testid="vision-unshare-tab"
                    icon={UnpublishIcon}
                    onClick={() => void shareTab.unshare()}
                    text={t('vision.tabs.unshare')}
                  />
                )}
              </Menu>
            }
            onClose={() => setMenuOpen(false)}
            onOpen={() => {
              // Params typed within the debounce window decide whether the tab changed since it
              // was shared, and so whether the menu offers to share it again
              pendingEdits.commit()
              setMenuOpen(true)
            }}
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
      {shareTab.confirming && (
        <Dialog
          animate
          data-testid="vision-share-tab-dialog"
          footer={
            <Flex gap={2} justifyContent="flex-end" padding={3}>
              <Button mode="bleed" onClick={shareTab.cancelShare} text={t('action.query-cancel')} />
              <Button
                data-testid="vision-share-tab-confirm"
                onClick={() => void shareTab.confirmShare()}
                text={t('label.share')}
                tone="primary"
              />
            </Flex>
          }
          header={t('vision.tabs.share')}
          id="vision-share-tab-dialog"
          onClose={shareTab.cancelShare}
          width={0}
        >
          <Box className={themeStyles.themeTokens} padding={4}>
            <Text size={1} as="div" trim={true}>
              {t('save-query.share-warning')}
            </Text>
          </Box>
        </Dialog>
      )}
    </>
  )
}
