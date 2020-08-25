import classNames from 'classnames'
import {negate} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import Button from 'part:@sanity/components/buttons/default'
import {Popover} from 'part:@sanity/components/popover'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {useCallback, useState} from 'react'
import {DocumentView, MenuAction, MenuItemGroup} from '../../types'
import {DocumentPanelContextMenu} from './contextMenu'
import {DocumentHeaderTabs} from './tabs'
import {Timeline} from './timeline'
import {ValidationMenu} from './validationMenu'

import styles from './header.css'

export interface DocumentPanelHeaderProps {
  activeViewId?: string
  idPrefix: string
  isClosable: boolean
  isCollapsed: boolean
  markers: any
  menuItems: MenuAction[]
  menuItemGroups: MenuItemGroup[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuAction) => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane: () => void
  schemaType: any
  setFocusPath: (path: any) => void
  title: React.ReactNode
  views: DocumentView[]
}

const isActionButton = (item: MenuAction) => (item as any).showAsAction
const isMenuButton = negate(isActionButton)

export function DocumentPanelHeader(props: DocumentPanelHeaderProps) {
  const contextMenuItems = props.menuItems.filter(isMenuButton)
  const [isContextMenuOpen, setContextMenuOpen] = useState(false)
  const [isVersionSelectOpen, setVersionSelectOpen] = useState(false)
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuOpen(false)
  }, [])

  const handleToggleContextMenu = useCallback(() => {
    setContextMenuOpen(!isContextMenuOpen)
  }, [isContextMenuOpen])

  const handleVersionsSelectClick = useCallback(() => {
    setVersionSelectOpen(!isVersionSelectOpen)
  }, [isVersionSelectOpen])

  const handleCloseValidationResults = useCallback(() => {
    setValidationOpen(false)
  }, [])

  const handleToggleValidationResults = useCallback(() => {
    setValidationOpen(!isValidationOpen)
  }, [isValidationOpen])

  const handleTitleClick = useCallback(() => {
    if (props.isCollapsed && props.onExpand) props.onExpand()
    if (!props.isCollapsed && props.onCollapse) props.onCollapse()
  }, [props.isCollapsed, props.onExpand, props.onCollapse])

  const handleTimelineSelect = useCallback(() => setVersionSelectOpen(false), [setContextMenuOpen])

  return (
    <div className={classNames(styles.root, props.isCollapsed && styles.isCollapsed)}>
      <div className={styles.mainNav}>
        <div className={styles.title} onClick={handleTitleClick}>
          <strong>{props.title}</strong>
        </div>

        <div className={styles.paneFunctions}>
          {LanguageFilter && <LanguageFilter />}
          <ValidationMenu
            isOpen={isValidationOpen}
            markers={props.markers}
            onClose={handleCloseValidationResults}
            onToggle={handleToggleValidationResults}
            schemaType={props.schemaType}
            setFocusPath={props.setFocusPath}
          />
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
          <Popover
            content={<Timeline onSelect={handleTimelineSelect} />}
            open={isVersionSelectOpen}
            placement="bottom-end"
          >
            <div>
              <Button
                kind="simple"
                onClick={handleVersionsSelectClick}
                padding="small"
                type="button"
              >
                Current draft &darr;
              </Button>
            </div>
          </Popover>
        </div>

        <div className={styles.viewActions}>
          {props.onSplitPane && props.views.length > 1 && (
            <button type="button" onClick={props.onSplitPane} title="Split pane right">
              <div tabIndex={-1}>
                <SplitHorizontalIcon />
              </div>
            </button>
          )}

          {props.onSplitPane && props.isClosable && (
            <button type="button" onClick={props.onCloseView} title="Close pane">
              <div tabIndex={-1}>
                <CloseIcon />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
