import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk} from '@sanity/field/diff'
import classNames from 'classnames'
import {negate, upperFirst} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import Button from 'part:@sanity/components/buttons/default'
import {MenuItemType, MenuItemGroupType} from 'part:@sanity/components/menus/default'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {useCallback, useState, useEffect} from 'react'
import {useDeskToolFeatures} from '../../../../features'
import {formatTimelineEventLabel} from '../../timeline'
import {DocumentView} from '../../types'
import {DocumentPanelContextMenu} from './contextMenu'
import {DocumentHeaderTabs} from './tabs'
import {ValidationMenu} from './validationMenu'

import styles from './header.css'

export interface DocumentPanelHeaderProps {
  activeViewId?: string
  idPrefix: string
  isClosable: boolean
  isCollapsed: boolean
  isHistoryOpen: boolean
  isTimelineOpen: boolean
  markers: any
  menuItems: MenuItemType[]
  menuItemGroups: MenuItemGroupType[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuItemType) => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  onTimelineOpen: () => void
  rev: Chunk | null
  schemaType: any
  setFocusPath: (path: any) => void
  timelineMode: 'rev' | 'since' | 'closed'
  title: React.ReactNode
  versionSelectRef: React.MutableRefObject<HTMLDivElement | null>
  views: DocumentView[]
}

const isActionButton = (item: MenuItemType) => (item as any).showAsAction
const isMenuButton = negate(isActionButton)

// eslint-disable-next-line complexity
export function DocumentPanelHeader(props: DocumentPanelHeaderProps) {
  const {
    activeViewId,
    idPrefix,
    isClosable,
    isCollapsed,
    isTimelineOpen,
    markers,
    menuItems,
    menuItemGroups,
    onCloseView,
    onContextMenuAction,
    onCollapse,
    onExpand,
    onSetActiveView,
    onSplitPane,
    onTimelineOpen,
    rev,
    schemaType,
    setFocusPath,
    timelineMode,
    title,
    versionSelectRef,
    views
  } = props
  const features = useDeskToolFeatures()
  const contextMenuItems = menuItems.filter(isMenuButton)
  const [isContextMenuOpen, setContextMenuOpen] = useState(false)
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)

  const handleTitleClick = useCallback(() => {
    if (isCollapsed && onExpand) onExpand()
    if (!isCollapsed && onCollapse) onCollapse()
  }, [isCollapsed, onExpand, onCollapse])

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const showTabs = features.splitViews && views.length > 1
  const showVersionMenu = true // isHistoryOpen
  const menuOpen = isTimelineOpen && timelineMode === 'rev'

  // const setOpen = useCallback((val: boolean) => {
  //   console.log('set open', val)
  // }, [])

  return (
    <div className={classNames(styles.root, isCollapsed && styles.isCollapsed)}>
      <div className={styles.mainNav}>
        <div className={styles.title} onClick={handleTitleClick}>
          <strong>{title}</strong>
        </div>

        <div className={styles.paneActions}>
          {LanguageFilter && (
            <div>
              <LanguageFilter />
            </div>
          )}

          <div>
            <ValidationMenu
              isOpen={isValidationOpen}
              markers={markers}
              schemaType={schemaType}
              setFocusPath={setFocusPath}
              setOpen={setValidationOpen}
            />
          </div>

          <div>
            <DocumentPanelContextMenu
              isCollapsed={isCollapsed}
              itemGroups={menuItemGroups}
              items={contextMenuItems}
              onAction={onContextMenuAction}
              open={isContextMenuOpen}
              setOpen={setContextMenuOpen}
            />
          </div>

          {features.splitViews && (
            <>
              {onSplitPane && views.length > 1 && (
                <div>
                  <Button
                    icon={SplitHorizontalIcon}
                    kind="simple"
                    onClick={onSplitPane}
                    padding="small"
                    title="Split pane right"
                    type="button"
                  />
                </div>
              )}

              {onSplitPane && isClosable && (
                <div>
                  <Button
                    icon={CloseIcon}
                    kind="simple"
                    onClick={onCloseView}
                    padding="small"
                    title="Close pane"
                    type="button"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {(showTabs || showVersionMenu) && (
        <div className={styles.viewNav}>
          {showTabs && (
            <div className={styles.tabsContainer}>
              <DocumentHeaderTabs
                activeViewId={activeViewId}
                idPrefix={idPrefix}
                onSetActiveView={onSetActiveView}
                views={views}
              />
            </div>
          )}

          {showVersionMenu && (
            <div className={styles.versionSelectContainer} ref={versionSelectRef}>
              <Button
                kind="simple"
                onMouseUp={ignoreClickOutside}
                onClick={onTimelineOpen}
                padding="small"
                selected={isTimelineOpen && timelineMode === 'rev'}
                size="small"
              >
                {/* eslint-disable-next-line no-nested-ternary */}
                {menuOpen ? (
                  <>Select version</>
                ) : rev ? (
                  <TimelineButtonLabel rev={rev} />
                ) : (
                  <>Current version</>
                )}{' '}
                &darr;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineButtonLabel({rev}: {rev: Chunk}) {
  const timeAgo = useTimeAgo(rev.endTimestamp)

  return (
    <>
      {upperFirst(formatTimelineEventLabel(rev.type))} {timeAgo}
    </>
  )
}
