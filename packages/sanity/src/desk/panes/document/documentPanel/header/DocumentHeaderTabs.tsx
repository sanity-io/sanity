import React, {useCallback} from 'react'
import {TabList} from '@sanity/ui'
import {useDocumentPane} from '../../useDocumentPane'
import {usePaneRouter} from '../../../../components'
import {Tab} from '../../../../../ui'

export function DocumentHeaderTabs() {
  const {activeViewId, paneKey, views} = useDocumentPane()
  const tabPanelId = `${paneKey}tabpanel`

  return (
    <TabList space={1}>
      {views.map((view, index) => (
        <DocumentHeaderTab
          icon={view.icon}
          id={`${paneKey}tab-${view.id}`}
          isActive={activeViewId === view.id}
          key={view.id}
          label={view.title}
          tabPanelId={tabPanelId}
          viewId={index === 0 ? null : view.id ?? null}
        />
      ))}
    </TabList>
  )
}

function DocumentHeaderTab(props: {
  icon?: React.ComponentType | React.ReactNode
  id: string
  isActive: boolean
  label: string
  tabPanelId: string
  viewId: string | null
}) {
  const {icon, id, isActive, label, tabPanelId, viewId} = props
  const {ready} = useDocumentPane()
  const {setView} = usePaneRouter()
  const handleClick = useCallback(() => setView(viewId), [setView, viewId])

  return (
    <Tab
      aria-controls={tabPanelId}
      disabled={!ready}
      icon={icon}
      id={id}
      label={label}
      onClick={handleClick}
      selected={isActive}
      size="small"
    />
  )
}
