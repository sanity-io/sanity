import React from 'react'
import {ArrowLeftIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {PaneMenuItem, PaneMenuItemGroup, DeskToolPaneActionHandler} from '../../types'
import {PaneHeader, PaneHeaderActions} from '../../components'
import {useDeskTool} from '../../contexts/deskTool'
import {BackLink} from '../../contexts/paneRouter'

interface UserComponentPaneHeaderProps {
  actionHandlers?: Record<string, DeskToolPaneActionHandler>
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export function UserComponentPaneHeader(props: UserComponentPaneHeaderProps) {
  const {actionHandlers, index, menuItems, menuItemGroups, title} = props
  const {features} = useDeskTool()

  if (!menuItems?.length && !title) {
    return null
  }

  return (
    <PaneHeader
      actions={
        <PaneHeaderActions
          menuItems={menuItems}
          menuItemGroups={menuItemGroups}
          actionHandlers={actionHandlers}
        />
      }
      backButton={
        features.backButton &&
        index > 0 && <Button as={BackLink} data-as="a" icon={ArrowLeftIcon} mode="bleed" />
      }
      title={title}
    />
  )
}
