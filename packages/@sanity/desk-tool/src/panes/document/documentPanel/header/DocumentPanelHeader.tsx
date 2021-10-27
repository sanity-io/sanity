// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Button, Inline} from '@sanity/ui'
import {negate} from 'lodash'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../../../../types'
import {PaneHeader, PaneContextMenuButton} from '../../../../components/pane'
import {useDeskTool} from '../../../../contexts/deskTool'
import {usePaneRouter} from '../../../../contexts/paneRouter'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {ValidationMenu} from './ValidationMenu'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'

export interface DocumentPanelHeaderProps {
  rootElement: HTMLDivElement | null
}

const isActionButton = (item: PaneMenuItem) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

export const DocumentPanelHeader = forwardRef(function DocumentPanelHeader(
  props: DocumentPanelHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {rootElement} = props
  const {
    documentSchema,
    handleMenuAction,
    handlePaneClose,
    handlePaneSplit,
    historyController,
    markers,
    menuItems,
    menuItemGroups,
    ready,
    views,
  } = useDocumentPane()
  const {revTime: rev} = historyController
  const {features} = useDeskTool()
  const {index, BackLink, siblingIndex, hasGroupSiblings} = usePaneRouter()
  const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
  const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)
  const showTabs = views.length > 1
  const showVersionMenu = features.reviewChanges

  const languageMenu = useMemo(
    () => LanguageFilter && <LanguageFilter key="language-menu" schemaType={documentSchema} />,
    [documentSchema]
  )

  const validationMenu = useMemo(
    () =>
      markers.length > 0 && (
        <ValidationMenu
          boundaryElement={rootElement}
          isOpen={isValidationOpen}
          key="validation-menu"
          setOpen={setValidationOpen}
        />
      ),
    [isValidationOpen, markers, rootElement]
  )

  const contextMenu = useMemo(
    () => (
      <PaneContextMenuButton
        itemGroups={menuItemGroups}
        items={contextMenuItems}
        key="context-menu"
        onAction={handleMenuAction}
      />
    ),
    [contextMenuItems, handleMenuAction, menuItemGroups]
  )

  const splitPaneButton = useMemo(() => {
    if (!features.splitViews || !handlePaneSplit || views.length <= 1) {
      return null
    }

    return (
      <Button
        icon={SplitVerticalIcon}
        key="split-pane-button"
        mode="bleed"
        onClick={handlePaneSplit}
        title="Split pane right"
      />
    )
  }, [features.splitViews, handlePaneSplit, views.length])

  const closeViewButton = useMemo(() => {
    if (features.splitViews && handlePaneSplit && hasGroupSiblings) {
      return (
        <Button
          icon={CloseIcon}
          key="close-view-button"
          mode="bleed"
          onClick={handlePaneClose}
          title="Close split pane"
        />
      )
    }

    if (!features.backButton) {
      return (
        <Button
          icon={CloseIcon}
          key="close-view-button"
          mode="bleed"
          title="Close pane group"
          as={BackLink}
        />
      )
    }
    return null
  }, [
    BackLink,
    features.backButton,
    features.splitViews,
    handlePaneClose,
    handlePaneSplit,
    hasGroupSiblings,
  ])

  const tabs = useMemo(() => showTabs && <DocumentHeaderTabs />, [showTabs])

  const actions = useMemo(
    () => (
      <Inline space={1}>
        {languageMenu}
        {validationMenu}
        {contextMenu}
        {splitPaneButton}
        {closeViewButton}
      </Inline>
    ),
    [languageMenu, validationMenu, contextMenu, splitPaneButton, closeViewButton]
  )

  const backButton = useMemo(
    () =>
      features.backButton &&
      index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />,
    [features.backButton, index]
  )

  return useMemo(
    () => (
      <PaneHeader
        actions={actions}
        backButton={backButton}
        loading={!ready}
        ref={ref}
        subActions={showVersionMenu && <TimelineMenu chunk={rev} mode="rev" />}
        tabs={tabs}
        title={<DocumentHeaderTitle />}
      />
    ),
    [actions, backButton, ready, ref, rev, showVersionMenu, tabs]
  )
})
