import {ArrowLeftIcon} from '@sanity/icons'
import React from 'react'
import {BackLink, PaneHeader, PaneHeaderActions, usePane} from '../../components'
import {Button} from '../../../ui'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {useDeskTool} from '../../useDeskTool'

interface ListPaneHeaderProps {
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export const ListPaneHeader = ({index, menuItems, menuItemGroups, title}: ListPaneHeaderProps) => {
  const {features} = useDeskTool()
  const {collapsed, isLast} = usePane()
  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  return (
    <PaneHeader
      actions={<PaneHeaderActions menuItems={menuItems} menuItemGroups={menuItemGroups} />}
      backButton={
        features.backButton &&
        index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
      }
      tabIndex={tabIndex}
      title={title}
    />
  )
}
