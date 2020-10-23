import {useTimeAgo} from '@sanity/base/hooks'
import {MenuItem, MenuItemGroup} from '@sanity/components'
import {Chunk} from '@sanity/field/diff'
import {Path} from '@sanity/types'
import classNames from 'classnames'
import {negate, upperFirst} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import Button from 'part:@sanity/components/buttons/default'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {useCallback, useState} from 'react'
import {DropdownButton} from '../../../../components/DropdownButton'
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
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuItem) => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  onSetFormInputFocus: (path: Path) => void
  onTimelineOpen: () => void
  rev: Chunk | null
  rootElement: HTMLDivElement | null
  schemaType: any
  timelineMode: 'rev' | 'since' | 'closed'
  title: React.ReactNode
  versionSelectRef: React.MutableRefObject<HTMLDivElement | null>
  views: DocumentView[]
}

const isActionButton = (item: MenuItem) => (item as any).showAsAction
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
    rootElement,
    schemaType,
    onSetFormInputFocus,
    timelineMode,
    title,
    versionSelectRef,
    views,
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

  const showTabs = views.length > 1
  const showVersionMenu = features.reviewChanges || views.length === 1
  const menuOpen = isTimelineOpen && timelineMode === 'rev'

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
              boundaryElement={rootElement}
              isOpen={isValidationOpen}
              markers={markers}
              schemaType={schemaType}
              setFocusPath={onSetFormInputFocus}
              setOpen={setValidationOpen}
            />
          </div>

          <div>
            <DocumentPanelContextMenu
              boundaryElement={rootElement}
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
              <DropdownButton
                onMouseUp={ignoreClickOutside}
                onClick={onTimelineOpen}
                selected={isTimelineOpen && timelineMode === 'rev'}
              >
                {/* eslint-disable-next-line no-nested-ternary */}
                {menuOpen ? (
                  <>Select version</>
                ) : rev ? (
                  <TimelineButtonLabel rev={rev} />
                ) : (
                  <>Current version</>
                )}
              </DropdownButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineButtonLabel({rev}: {rev: Chunk}) {
  const timeAgo = useTimeAgo(rev.endTimestamp, {agoSuffix: true})

  return (
    <>
      {upperFirst(formatTimelineEventLabel(rev.type))} {timeAgo}
    </>
  )
}
