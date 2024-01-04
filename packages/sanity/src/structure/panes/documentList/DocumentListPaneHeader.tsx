import {ArrowLeftIcon} from '@sanity/icons'
import React, {memo, useMemo} from 'react'
import {TooltipDelayGroupProvider} from '@sanity/ui'
import type {PaneMenuItem, PaneMenuItemGroup, StructureToolPaneActionHandler} from '../../types'
import {BackLink, PaneHeader, PaneHeaderActions, usePane} from '../../components'
import {Button, TOOLTIP_DELAY_PROPS} from '../../../ui-components'
import {useStructureTool} from '../../useStructureTool'
import type {SortOrder} from './types'
import type {GeneralPreviewLayoutKey, InitialValueTemplateItem} from 'sanity'

interface DocumentListPaneHeaderProps {
  contentAfter?: React.ReactNode
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  menuItems?: PaneMenuItem[]
  setLayout: (layout: GeneralPreviewLayoutKey) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
}

export const DocumentListPaneHeader = memo(
  ({
    contentAfter,
    index,
    initialValueTemplates = [],
    menuItemGroups = [],
    menuItems = [],
    setLayout,
    setSortOrder,
    title,
  }: DocumentListPaneHeaderProps) => {
    const {features} = useStructureTool()
    const {collapsed, isLast} = usePane()
    // Prevent focus if this is the last (non-collapsed) pane.
    const tabIndex = isLast && !collapsed ? -1 : 0

    const actionHandlers = useMemo((): Record<string, StructureToolPaneActionHandler> => {
      return {
        setLayout: ({layout: value}: {layout: GeneralPreviewLayoutKey}) => {
          setLayout(value)
        },
        setSortOrder: (sort: SortOrder) => {
          setSortOrder(sort)
        },
      }
    }, [setLayout, setSortOrder])

    return (
      <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
        <PaneHeader
          actions={
            <PaneHeaderActions
              initialValueTemplateItems={initialValueTemplates}
              actionHandlers={actionHandlers}
              menuItemGroups={menuItemGroups}
              menuItems={menuItems}
            />
          }
          backButton={
            features.backButton &&
            index > 0 && (
              <Button
                as={BackLink}
                data-as="a"
                icon={ArrowLeftIcon}
                mode="bleed"
                tooltipProps={{content: 'Back'}}
              />
            )
          }
          contentAfter={contentAfter}
          tabIndex={tabIndex}
          title={title}
        />
      </TooltipDelayGroupProvider>
    )
  },
)

DocumentListPaneHeader.displayName = 'DocumentListPaneHeader'
