import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk} from '@sanity/field/diff'
import classNames from 'classnames'
import {negate, upperFirst} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import Button from 'part:@sanity/components/buttons/default'
import {MenuItemType, MenuItemGroupType} from 'part:@sanity/components/menus/default'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {useCallback, useState} from 'react'
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
  schemaType: any
  setFocusPath: (path: any) => void
  timelineMode: 'rev' | 'since' | 'closed'
  title: React.ReactNode
  versionSelectRef: React.MutableRefObject<HTMLDivElement | null>
  views: DocumentView[]
  rev: Chunk | null
  isHistoryOpen: boolean
}

const isActionButton = (item: MenuItemType) => (item as any).showAsAction
const isMenuButton = negate(isActionButton)

// eslint-disable-next-line complexity
export function DocumentPanelHeader(props: DocumentPanelHeaderProps) {
  const features = useDeskToolFeatures()
  const contextMenuItems = props.menuItems.filter(isMenuButton)
  const [isContextMenuOpen, setContextMenuOpen] = useState(false)
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)
  const {rev} = props

  const handleTitleClick = useCallback(() => {
    if (props.isCollapsed && props.onExpand) props.onExpand()
    if (!props.isCollapsed && props.onCollapse) props.onCollapse()
  }, [props.isCollapsed, props.onExpand, props.onCollapse])

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const showTabs = features.splitViews && props.views.length > 1
  const showVersionMenu = true // props.isHistoryOpen
  const menuOpen = props.isTimelineOpen && props.timelineMode === 'rev'

  return (
    <div className={classNames(styles.root, props.isCollapsed && styles.isCollapsed)}>
      <div className={styles.mainNav}>
        <div className={styles.title} onClick={handleTitleClick}>
          <strong>{props.title}</strong>
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
              markers={props.markers}
              schemaType={props.schemaType}
              setFocusPath={props.setFocusPath}
              setOpen={setValidationOpen}
            />
          </div>

          <div>
            <DocumentPanelContextMenu
              isCollapsed={props.isCollapsed}
              itemGroups={props.menuItemGroups}
              items={contextMenuItems}
              onAction={props.onContextMenuAction}
              open={isContextMenuOpen}
              setOpen={setContextMenuOpen}
            />
          </div>

          {features.splitViews && (
            <>
              {props.onSplitPane && props.views.length > 1 && (
                <div>
                  <Button
                    icon={SplitHorizontalIcon}
                    kind="simple"
                    onClick={props.onSplitPane}
                    padding="small"
                    title="Split pane right"
                    type="button"
                  />
                </div>
              )}

              {props.onSplitPane && props.isClosable && (
                <div>
                  <Button
                    icon={CloseIcon}
                    kind="simple"
                    onClick={props.onCloseView}
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
                activeViewId={props.activeViewId}
                idPrefix={props.idPrefix}
                onSetActiveView={props.onSetActiveView}
                views={props.views}
              />
            </div>
          )}

          {showVersionMenu && (
            <div className={styles.versionSelectContainer} ref={props.versionSelectRef}>
              <Button
                kind="simple"
                onMouseUp={ignoreClickOutside}
                onClick={props.onTimelineOpen}
                padding="small"
                selected={props.isTimelineOpen && props.timelineMode === 'rev'}
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
