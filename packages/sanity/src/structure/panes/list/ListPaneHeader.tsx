import {ArrowLeftIcon} from '@sanity/icons'
import {Button} from 'sanity/ui-components'

import {PaneHeader} from '../../components/pane/PaneHeader'
import {usePane} from '../../components/pane/usePane'
import {PaneHeaderActions} from '../../components/paneHeaderActions/PaneHeaderActions'
import {BackLink} from '../../components/paneRouter/BackLink'
import {type PaneMenuItem, type PaneMenuItemGroup} from '../../types'
import {useStructureTool} from '../../useStructureTool'

interface ListPaneHeaderProps {
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export const ListPaneHeader = ({index, menuItems, menuItemGroups, title}: ListPaneHeaderProps) => {
  const {features} = useStructureTool()
  const {collapsed, isLast} = usePane()
  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  return (
    <PaneHeader
      actions={<PaneHeaderActions menuItems={menuItems} menuItemGroups={menuItemGroups} />}
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
      tabIndex={tabIndex}
      title={title}
    />
  )
}
