import React, {useCallback} from 'react'
import {Tab, TabList} from '@sanity/ui'
import {DocumentView} from '../../types'
import {usePaneRouter} from '../../../../contexts/paneRouter'

export function DocumentHeaderTabs(props: {
  activeViewId?: string
  idPrefix: string
  views?: DocumentView[]
}) {
  const {activeViewId, idPrefix, views = []} = props
  const tabPanelId = `${idPrefix}tabpanel`

  return (
    <TabList space={1}>
      {views.map((view, index) => (
        <DocumentHeaderTab
          icon={view.icon}
          id={`${idPrefix}tab-${view.id}`}
          isActive={activeViewId === view.id}
          key={view.id}
          label={<>{view.title}</>}
          tabPanelId={tabPanelId}
          viewId={index === 0 ? null : view.id}
        />
      ))}
    </TabList>
  )
}

function DocumentHeaderTab(props: {
  icon?: React.ComponentType
  id: string
  isActive: boolean
  label: React.ReactNode
  tabPanelId: string
  viewId: string | null
}) {
  const {icon, id, isActive, label, tabPanelId, viewId} = props
  const {setView} = usePaneRouter()
  const handleClick = useCallback(() => setView(viewId), [setView, viewId])

  return (
    <Tab
      aria-controls={tabPanelId}
      fontSize={1}
      icon={icon}
      id={id}
      selected={isActive}
      label={label as any}
      onClick={handleClick}
    />
  )
}
