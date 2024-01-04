import React from 'react'
import {ArrowLeftIcon} from '@sanity/icons'
import {Button} from '../../../ui-components'
import type {PaneMenuItem, PaneMenuItemGroup, StructureToolPaneActionHandler} from '../../types'
import {BackLink, PaneHeader, PaneHeaderActions} from '../../components'
import {useStructureTool} from '../../useStructureTool'

interface UserComponentPaneHeaderProps {
  actionHandlers?: Record<string, StructureToolPaneActionHandler>
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export function UserComponentPaneHeader(props: UserComponentPaneHeaderProps) {
  const {actionHandlers, index, menuItems, menuItemGroups, title} = props
  const {features} = useStructureTool()

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
      title={title}
    />
  )
}
