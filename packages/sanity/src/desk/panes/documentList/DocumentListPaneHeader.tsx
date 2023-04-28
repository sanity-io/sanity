import {ArrowLeftIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React, {memo, useMemo} from 'react'
import {PaneMenuItem, PaneMenuItemGroup, DeskToolPaneActionHandler} from '../../types'
import {BackLink, PaneHeader, PaneHeaderActions, usePane} from '../../components'
import {useDeskTool} from '../../useDeskTool'
import {SortOrder} from './types'
import {GeneralPreviewLayoutKey, InitialValueTemplateItem} from 'sanity'

interface DocumentListPaneHeaderProps {
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  setLayout: (layout: GeneralPreviewLayoutKey) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
  contentAfter?: React.ReactNode
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
    const {features} = useDeskTool()
    const {isLast} = usePane()

    const tabIndex = isLast ? -1 : 0

    const actionHandlers = useMemo((): Record<string, DeskToolPaneActionHandler> => {
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
      <PaneHeader
        backButton={
          features.backButton &&
          index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
        }
        title={title}
        tabIndex={tabIndex}
        actions={
          <PaneHeaderActions
            initialValueTemplateItems={initialValueTemplates}
            actionHandlers={actionHandlers}
            menuItemGroups={menuItemGroups}
            menuItems={menuItems}
          />
        }
        contentAfter={contentAfter}
      />
    )
  }
)

DocumentListPaneHeader.displayName = 'DocumentListPaneHeader'
