import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Button, Flex, Text, Tooltip} from '@sanity/ui'
import {negate} from 'lodash'
import React, {createElement, memo, forwardRef, useMemo} from 'react'
import {PaneMenuItem} from '../../../../types'
import {
  PaneContextMenuButton,
  PaneHeader,
  PaneHeaderActionButton,
  usePane,
  usePaneRouter,
} from '../../../../components'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {useDeskTool} from '../../../../useDeskTool'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {useTimelineSelector} from 'sanity'

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
      menuItems,
      menuItemGroups,
      schemaType,
      timelineStore,
      ready,
      views,
      unstable_languageFilter,
    } = useDocumentPane()
    const {features} = useDeskTool()
    const {index, BackLink, hasGroupSiblings} = usePaneRouter()
    const actionItems = useMemo(() => menuItems.filter(isActionButton), [menuItems])
    const contextMenuItems = useMemo(() => menuItems.filter(isMenuButton), [menuItems])
    const showTabs = views.length > 1

    // Subscribe to external timeline state changes
    const rev = useTimelineSelector(timelineStore, (state) => state.revTime)

    const {collapsed, isLast} = usePane()
    // Prevent focus if this is the last (non-collapsed) pane.
    const tabIndex = isLast && !collapsed ? -1 : 0

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
        tabIndex={tabIndex}
        backButton={
          features.backButton &&
          index > 0 && (
            <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" padding={2} />
          )
        }
        subActions={<TimelineMenu chunk={rev} mode="rev" placement="bottom-end" />}
        actions={
          <Flex align="center" gap={1}>
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

            {actionItems.map((item, itemIndex) => (
              <PaneHeaderActionButton item={item} key={itemIndex} onMenuAction={onMenuAction} />
            ))}

            <PaneContextMenuButton
              itemGroups={menuItemGroups}
              items={contextMenuItems}
              key="context-menu"
              onAction={onMenuAction}
            />

            {showSplitPaneButton && (
              <Tooltip
                content={
                  <Text size={1} style={{whiteSpace: 'nowrap'}}>
                    Split pane right
                  </Text>
                }
                padding={2}
                placement="bottom"
                portal
              >
                <Button
                  aria-label="Split pane right"
                  icon={SplitVerticalIcon}
                  key="split-pane-button"
                  mode="bleed"
                  onClick={onPaneSplit}
                />
              </Tooltip>
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
          </Flex>
        }
      />
    )
  })
)

DocumentPanelHeader.displayName = 'DocumentPanelHeader'
