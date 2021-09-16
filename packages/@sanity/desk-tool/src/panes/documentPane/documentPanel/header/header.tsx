// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {LegacyLayerProvider} from '@sanity/base/components'
import {Chunk} from '@sanity/field/diff'
import {CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Path} from '@sanity/types'
import {Box, BoundaryElementProvider, Button, Layer} from '@sanity/ui'
import classNames from 'classnames'
import {negate} from 'lodash'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {useCallback, useMemo, useState} from 'react'
import {useDeskToolFeatures} from '../../../../features'

import {DocumentView} from '../../types'
import {TimelineMenu} from '../../timeline'
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
  markers: any
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuItem) => void
  onCollapse?: () => void
  onExpand?: () => void
  onSetActiveView: (id: string | null) => void
  onSplitPane?: () => void
  onSetFormInputFocus: (path: Path) => void
  rev: Chunk | null
  rootElement: HTMLDivElement | null
  schemaType: any
  title: React.ReactNode
  views: DocumentView[]
  timelinePopoverBoundaryElement: HTMLDivElement | null
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
    markers,
    menuItems,
    menuItemGroups,
    onCloseView,
    onContextMenuAction,
    onCollapse,
    onExpand,
    onSetActiveView,
    onSplitPane,
    rev,
    rootElement,
    schemaType,
    onSetFormInputFocus,
    title,
    views,
    timelinePopoverBoundaryElement,
  } = props
  const features = useDeskToolFeatures()
  const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
  const [isContextMenuOpen, setContextMenuOpen] = useState(false)
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)

  const handleTitleClick = useCallback(() => {
    if (isCollapsed && onExpand) onExpand()
    if (!isCollapsed && onCollapse) onCollapse()
  }, [isCollapsed, onExpand, onCollapse])

  const showTabs = views.length > 1
  const showVersionMenu = features.reviewChanges || views.length === 1

  const validationMenu = useMemo(
    () => (
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
    ),
    [isValidationOpen, markers, onSetFormInputFocus, rootElement, schemaType]
  )

  const contextMenu = useMemo(
    () => (
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
    ),
    [
      contextMenuItems,
      isCollapsed,
      isContextMenuOpen,
      menuItemGroups,
      onContextMenuAction,
      rootElement,
    ]
  )

  const splitViewActions = useMemo(
    () =>
      features.splitViews && (
        <>
          {onSplitPane && views.length > 1 && (
            <div>
              <Button
                icon={SplitVerticalIcon}
                mode="bleed"
                onClick={onSplitPane}
                padding={2}
                title="Split pane right"
              />
            </div>
          )}

          {onSplitPane && isClosable && (
            <div>
              <Button
                icon={CloseIcon}
                mode="bleed"
                onClick={onCloseView}
                padding={2}
                title="Close pane"
              />
            </div>
          )}
        </>
      ),
    [features.splitViews, isClosable, onCloseView, onSplitPane, views.length]
  )

  const tabs = useMemo(
    () =>
      showTabs && (
        <div className={styles.tabsContainer}>
          <DocumentHeaderTabs
            activeViewId={activeViewId}
            idPrefix={idPrefix}
            onSetActiveView={onSetActiveView}
            views={views}
          />
        </div>
      ),
    [activeViewId, idPrefix, onSetActiveView, showTabs, views]
  )

  const versionMenu = useMemo(
    () =>
      showVersionMenu && (
        <Box marginX={1} style={{marginLeft: 'auto'}}>
          <BoundaryElementProvider element={timelinePopoverBoundaryElement}>
            <LegacyLayerProvider zOffset="paneHeader">
              <TimelineMenu chunk={rev} mode="rev" />
            </LegacyLayerProvider>
          </BoundaryElementProvider>
        </Box>
      ),
    [rev, showVersionMenu, timelinePopoverBoundaryElement]
  )

  return (
    <Layer className={classNames(styles.root, isCollapsed && styles.isCollapsed)}>
      <div className={styles.mainNav}>
        <div className={styles.title} onClick={handleTitleClick}>
          <strong>{title}</strong>
        </div>

        <div className={styles.paneActions}>
          {LanguageFilter && (
            <div>
              <LanguageFilter schemaType={schemaType} />
            </div>
          )}

          {validationMenu}
          {contextMenu}
          {splitViewActions}
        </div>
      </div>

      {(showTabs || showVersionMenu) && (
        <div className={styles.viewNav}>
          {tabs}
          {versionMenu}
        </div>
      )}
    </Layer>
  )
}
