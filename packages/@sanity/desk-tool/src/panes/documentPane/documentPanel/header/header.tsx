import {negate} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import React, {useCallback, useState} from 'react'
import {DocumentView, MenuAction, MenuItemGroup} from '../../types'
import {DocumentPanelContextMenu} from './contextMenu'
import {DocumentHeaderTabs} from './tabs'
import {TimelineDropdown} from './timelineDropdown'

import styles from './header.css'

export interface DocumentPanelHeaderProps {
  activeViewId?: string
  idPrefix: string
  isClosable: boolean
  isCollapsed: boolean
  menuItems: MenuAction[]
  menuItemGroups: MenuItemGroup[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuAction) => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  title: React.ReactNode
  views: DocumentView[]
}

const isActionButton = (item: MenuAction) => (item as any).showAsAction
const isMenuButton = negate(isActionButton)

export function DocumentPanelHeader(props: DocumentPanelHeaderProps) {
  const contextMenuItems = props.menuItems.filter(isMenuButton)
  const [isContextMenuOpen, setContextMenuOpen] = useState(false)
  const [isVersionSelectOpen, setVersionSelectOpen] = useState(false)

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuOpen(false)
  }, [])

  const handleToggleContextMenu = useCallback(() => {
    setContextMenuOpen(!isContextMenuOpen)
  }, [isContextMenuOpen])

  const handleVersionsSelectClick = useCallback(() => {
    setVersionSelectOpen(!isVersionSelectOpen)
  }, [isVersionSelectOpen])

  return (
    <div className={styles.root}>
      <div className={styles.mainNav}>
        <div className={styles.title}>
          <strong>{props.title}</strong>
        </div>

        <div className={styles.contextMenuContainer}>
          <DocumentPanelContextMenu
            isCollapsed={props.isCollapsed}
            isOpen={isContextMenuOpen}
            itemGroups={props.menuItemGroups}
            items={contextMenuItems}
            onAction={props.onContextMenuAction}
            onCloseMenu={handleCloseContextMenu}
            onToggleMenu={handleToggleContextMenu}
          />
        </div>
      </div>

      <div className={styles.viewNav}>
        {props.views.length > 1 && (
          <div className={styles.tabsContainer}>
            <DocumentHeaderTabs
              activeViewId={props.activeViewId}
              idPrefix={props.idPrefix}
              onSetActiveView={props.onSetActiveView}
              views={props.views}
            />
          </div>
        )}

        <div className={styles.versionSelectContainer}>
          <TimelineDropdown
            isOpen={isVersionSelectOpen}
            refNode={
              <button onClick={handleVersionsSelectClick} type="button">
                Current draft &darr;
              </button>
            }
          />
        </div>

        {props.onSplitPane && props.isClosable && (
          <div className={styles.viewActions}>
            <button type="button" onClick={props.onCloseView} title="Close pane">
              <div tabIndex={-1}>
                <CloseIcon />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
