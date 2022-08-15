import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Button, Inline} from '@sanity/ui'
import {negate} from 'lodash'
import React, {createElement, memo, forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../../../../types'
import {PaneHeader, PaneContextMenuButton, usePaneRouter} from '../../../../components'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {useDeskTool} from '../../../../useDeskTool'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {ValidationMenu} from './ValidationMenu'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'

export interface DocumentPanelHeaderProps {
  // TODO:
  // eslint-disable-next-line react/no-unused-prop-types
  rootElement: HTMLDivElement | null
}

const isActionButton = (item: PaneMenuItem) => Boolean(item.showAsAction)
const isMenuButton = negate(isActionButton)

export const DocumentPanelHeader = memo(
  forwardRef(({rootElement}: DocumentPanelHeaderProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const {
      onMenuAction,
      onPaneClose,
      onPaneSplit,
      historyController,
      validation,
      menuItems,
      menuItemGroups,
      schemaType,
      ready,
      views,
      unstable_languageFilter,
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
    const showSplitPaneButton = features.splitViews && onPaneSplit && views.length > 1

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
            {unstable_languageFilter.length > 0 && (
              <>
                {unstable_languageFilter.map((languageFilterComponent, idx) => {
                  return createElement(languageFilterComponent, {
                    // eslint-disable-next-line react/no-array-index-key
                    key: `language-filter-${idx}`,
                    schemaType,
                  })
                })}
              </>
            )}

            {validation.length > 0 && (
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
              onAction={onMenuAction}
            />

            {showSplitPaneButton && (
              <Button
                icon={SplitVerticalIcon}
                key="split-pane-button"
                mode="bleed"
                onClick={onPaneSplit}
                title="Split pane right"
              />
            )}

            {showSplitPaneCloseButton && (
              <Button
                icon={CloseIcon}
                key="close-view-button"
                mode="bleed"
                onClick={onPaneClose}
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
