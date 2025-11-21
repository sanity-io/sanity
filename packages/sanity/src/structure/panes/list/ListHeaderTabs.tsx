import {TabList} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback} from 'react'

import {Tab} from '../../../ui-components'
import {usePaneRouter} from '../../components'
import {useListPane} from './useListPane'

/**
 * @internal
 */
export function ListHeaderTabs() {
  const {activeViewId, views} = useListPane()

  if (!views || views.length === 0) {
    return null
  }

  // Create a combined array of all tabs (default list + custom views)
  const allTabs = [
    {id: '__list__', title: 'List', icon: undefined, isDefault: true},
    ...views.map((view) => ({...view, isDefault: false})),
  ]

  return (
    <TabList space={1}>
      {allTabs.map((tab) => (
        <ListHeaderTab
          key={tab.id}
          icon={tab.icon}
          isActive={tab.isDefault ? activeViewId === null : activeViewId === tab.id}
          label={tab.title}
          viewId={tab.isDefault ? null : tab.id}
        />
      ))}
    </TabList>
  )
}

function ListHeaderTab(props: {
  icon?: ComponentType | ReactNode
  isActive: boolean
  label: string
  viewId: string | null
}) {
  const {icon, isActive, label, viewId} = props
  const {setView} = usePaneRouter()
  const handleClick = useCallback(() => setView(viewId), [setView, viewId])

  const tabId = `list-view-tab-${viewId || 'default'}`
  const panelId = `list-view-panel-${viewId || 'default'}`

  return (
    <Tab
      aria-controls={panelId}
      icon={icon}
      id={tabId}
      label={label}
      onClick={handleClick}
      selected={isActive}
    />
  )
}
