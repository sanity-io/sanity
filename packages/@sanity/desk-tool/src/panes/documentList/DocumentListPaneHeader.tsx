import {ArrowLeftIcon} from '@sanity/icons'
import type {InitialValueTemplateItem} from '@sanity/structure'
import {Button} from '@sanity/ui'
import React, {memo, useMemo} from 'react'
import type {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {PaneHeader, PaneHeaderActions} from '../../components'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'
import type {DeskToolPaneActionHandler} from '../../types/types'
import type {Layout, SortOrder} from './types'

interface DocumentListPaneHeaderProps {
  index: number
  initialValueTemplates?: InitialValueTemplateItem[]
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  setLayout: (layout: Layout) => void
  setSortOrder: (sortOrder: SortOrder) => void
  title: string
}

export const DocumentListPaneHeader = memo(
  ({
    index,
    initialValueTemplates = [],
    menuItems = [],
    menuItemGroups = [],
    setLayout,
    setSortOrder,
    title,
  }: DocumentListPaneHeaderProps) => {
    const {features} = useDeskTool()

    const actionHandlers = useMemo((): Record<string, DeskToolPaneActionHandler> => {
      return {
        setLayout: ({layout: value}: {layout: Layout}) => {
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
        actions={
          <PaneHeaderActions
            initialValueTemplateItems={initialValueTemplates}
            actionHandlers={actionHandlers}
            menuItemGroups={menuItemGroups}
            menuItems={menuItems}
          />
        }
      />
    )
  }
)

DocumentListPaneHeader.displayName = 'DocumentListPaneHeader'
