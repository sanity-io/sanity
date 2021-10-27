// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Button, Inline} from '@sanity/ui'
import {negate} from 'lodash'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import React, {memo, forwardRef, useMemo} from 'react'
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

export const DocumentPanelHeader = memo(
  forwardRef(({rootElement}: DocumentPanelHeaderProps, ref: React.ForwardedRef<HTMLDivElement>) => {
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
    const {index, BackLink, hasGroupSiblings} = usePaneRouter()
    const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
    const [isValidationOpen, setValidationOpen] = React.useState<boolean>(false)
    const showTabs = views.length > 1
    const showVersionMenu = features.reviewChanges

    // there are three kinds of buttons possible:
    //
    // 1. split pane - creates a new split pane
    // 2. close split pane — closes the current split pane
    // 3. close pane group — closes the current pane group

    // show the split pane button if they're enabled and there is more than one
    // view available to use to create a split view
    const showSplitPaneButton = features.splitViews && handlePaneSplit && views.length > 1

    // show the split pane button close button if the split button is showing
    // and there is more than one split pane open (aka has-siblings)
    const showSplitPaneCloseButton = showSplitPaneButton && hasGroupSiblings

    // show the pane group close button if the `showSplitPaneCloseButton` is
    // _not_ showing (the split pane button replaces the group close button)
    // and if the back button is not showing (the back button and the close
    // button) do the same thing and shouldn't be shown at the same time)
    const showPaneGroupCloseButton = !showSplitPaneCloseButton && !features.backButton

    return (
      <PaneHeader
        ref={ref}
        loading={!ready}
        title={<DocumentHeaderTitle />}
        tabs={showTabs && <DocumentHeaderTabs />}
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        subActions={showVersionMenu && <TimelineMenu chunk={rev} mode="rev" />}
        actions={
          <Inline space={1}>
            {LanguageFilter && <LanguageFilter key="language-menu" schemaType={documentSchema} />}

            {markers.length > 0 && (
              <ValidationMenu
                boundaryElement={rootElement}
                isOpen={isValidationOpen}
                key="validation-menu"
                setOpen={setValidationOpen}
              />
            )}

            <PaneContextMenuButton
              itemGroups={menuItemGroups}
              items={contextMenuItems}
              key="context-menu"
              onAction={handleMenuAction}
            />

            {showSplitPaneButton && (
              <Button
                icon={SplitVerticalIcon}
                key="split-pane-button"
                mode="bleed"
                onClick={handlePaneSplit}
                title="Split pane right"
              />
            )}

            {showSplitPaneCloseButton && (
              <Button
                icon={CloseIcon}
                key="close-view-button"
                mode="bleed"
                onClick={handlePaneClose}
                title="Close split pane"
              />
            )}

            {showPaneGroupCloseButton && (
              <Button
                icon={CloseIcon}
                key="close-view-button"
                mode="bleed"
                title="Close pane group"
                as={BackLink}
              />
            )}
          </Inline>
        }
      />
    )
  })
)

DocumentPanelHeader.displayName = 'DocumentPanelHeader'
