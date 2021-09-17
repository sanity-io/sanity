// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useTimeAgo} from '@sanity/base/hooks'
import {
  MenuItem as MenuItemType,
  MenuItemGroup as MenuItemGroupType,
} from '@sanity/base/__legacy/@sanity/components'
import {Chunk} from '@sanity/field/diff'
import {ArrowLeftIcon, CloseIcon, SelectIcon, SplitVerticalIcon} from '@sanity/icons'
import {Marker, Path} from '@sanity/types'
import {Button, Inline} from '@sanity/ui'
import {negate, upperFirst} from 'lodash'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {forwardRef, useCallback, useMemo} from 'react'
import {PaneHeader, PaneContextMenuButton} from '../../../../components/pane'
import {useDeskTool} from '../../../../contexts/deskTool'
import {usePaneRouter} from '../../../../contexts/paneRouter'
import {formatTimelineEventLabel} from '../../timeline'
import {DocumentView} from '../../types'
import {DocumentHeaderTabs} from './tabs'
import {ValidationMenu} from './validationMenu'

export interface DocumentPanelHeaderProps {
  activeViewId?: string
  idPrefix: string
  isClosable: boolean
  isHistoryOpen: boolean
  isTimelineOpen: boolean
  markers: Marker[]
  menuItems: MenuItemType[]
  menuItemGroups: MenuItemGroupType[]
  onCloseView: () => void
  onContextMenuAction: (action: MenuItemType) => void
  onSplitPane?: () => void
  onSetFormInputFocus: (path: Path) => void
  rev: Chunk | null
  rootElement: HTMLDivElement | null
  schemaType: any
  title: React.ReactNode
  versionSelectRef: React.MutableRefObject<HTMLButtonElement | null>
  views: DocumentView[]
  timelinePopoverBoundaryElement: HTMLDivElement | null
}

const isActionButton = (item: MenuItemType) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

export const DocumentPanelHeader = forwardRef(function DocumentPanelHeader(
  props: DocumentPanelHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    activeViewId,
    idPrefix,
    isClosable,
    isTimelineOpen,
    markers,
    menuItems,
    menuItemGroups,
    onCloseView,
    onContextMenuAction,
    onSplitPane,
    rev,
    rootElement,
    schemaType,
    onSetFormInputFocus,
    title,
    views,
    timelinePopoverBoundaryElement,
  } = props
  const {features} = useDeskTool()
  const {BackLink, index} = usePaneRouter()
  const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const showTabs = views.length > 1
  const showVersionMenu = features.reviewChanges || views.length === 1

  const languageMenu = LanguageFilter && (
    <LanguageFilter key="language-menu" schemaType={schemaType} />
  )

  const validationMenu = useMemo(
    () =>
      markers.length > 0 && (
        <ValidationMenu
          boundaryElement={rootElement}
          isOpen={isValidationOpen}
          key="validation-menu"
          markers={markers}
          schemaType={schemaType}
          setFocusPath={onSetFormInputFocus}
          setOpen={setValidationOpen}
        />
      ),
    [isValidationOpen, markers, onSetFormInputFocus, rootElement, schemaType]
  )

  const contextMenu = useMemo(
    () => (
      <PaneContextMenuButton
        boundaryElement={rootElement}
        itemGroups={menuItemGroups}
        items={contextMenuItems}
        key="context-menu"
        onAction={onContextMenuAction}
      />
    ),
    [contextMenuItems, menuItemGroups, onContextMenuAction, rootElement]
  )

  const splitPaneButton = useMemo(() => {
    if (!features.splitViews || !onSplitPane || views.length <= 1) {
      return null
    }

    return (
      <Button
        icon={SplitVerticalIcon}
        key="split-pane-button"
        mode="bleed"
        onClick={onSplitPane}
        title="Split pane right"
      />
    )
  }, [features.splitViews, onSplitPane, views.length])

  const closeViewButton = useMemo(() => {
    if (!features.splitViews || !onSplitPane || !isClosable) {
      return null
    }

    return (
      <Button
        icon={CloseIcon}
        key="close-view-button"
        mode="bleed"
        onClick={onCloseView}
        title="Close pane"
      />
    )
  }, [features.splitViews, isClosable, onCloseView, onSplitPane])

  const tabs = useMemo(
    () =>
      showTabs && (
        <DocumentHeaderTabs activeViewId={activeViewId} idPrefix={idPrefix} views={views} />
      ),
    [activeViewId, idPrefix, showTabs, views]
  )

  const versionMenu = useMemo(
    () =>
      showVersionMenu && (
        <Button
          fontSize={1}
          iconRight={SelectIcon}
          mode="bleed"
          onMouseUp={ignoreClickOutside}
          onClick={onTimelineOpen}
          padding={2}
          ref={versionSelectRef}
          selected={isTimelineOpen && timelineMode === 'rev'}
          text={
            // eslint-disable-next-line no-nested-ternary
            menuOpen ? (
              <>Select version</>
            ) : rev ? (
              <TimelineButtonLabel rev={rev} />
            ) : (
              <>Current version</>
            )
          }
        />
      ),
    [rev, showVersionMenu, timelinePopoverBoundaryElement]
  )

  return (
    <PaneHeader
      actions={
        <Inline space={1}>
          {languageMenu}
          {validationMenu}
          {contextMenu}
          {splitPaneButton}
          {closeViewButton}
        </Inline>
      }
      backButton={
        features.backButton &&
        index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
      }
      ref={ref}
      subActions={versionMenu}
      tabs={tabs}
      title={title}
    />
  )
})

function TimelineButtonLabel({rev}: {rev: Chunk}) {
  const timeAgo = useTimeAgo(rev.endTimestamp, {agoSuffix: true})

  return (
    <>
      {upperFirst(formatTimelineEventLabel(rev.type))} {timeAgo}
    </>
  )
}
