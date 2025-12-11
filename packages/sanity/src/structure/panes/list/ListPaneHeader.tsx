import {ArrowLeftIcon} from '@sanity/icons'
import {useMemo} from 'react'

import {Button} from '../../../ui-components'
import {BackLink, PaneHeader, PaneHeaderActions, usePane} from '../../components'
import {type PaneMenuItem, type PaneMenuItemGroup} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {ListHeaderTabs} from './ListHeaderTabs'
import {useListPane} from './useListPane'

interface ListPaneHeaderProps {
  index: number
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  title: string
}

export const ListPaneHeader = ({index, menuItems, menuItemGroups, title}: ListPaneHeaderProps) => {
  const {features} = useStructureTool()
  const {collapsed, isLast} = usePane()
  const {views} = useListPane()

  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  // Show tabs if views are defined
  const showTabs = views && views.length > 0
  const tabs = useMemo(() => showTabs && <ListHeaderTabs />, [showTabs])

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
      tabs={tabs}
      tabIndex={tabIndex}
      title={title}
    />
  )
}
