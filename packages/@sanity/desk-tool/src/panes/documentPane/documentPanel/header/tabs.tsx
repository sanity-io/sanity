import React, {useCallback} from 'react'
import Tab from 'part:@sanity/components/tabs/tab'
import TabList from 'part:@sanity/components/tabs/tab-list'
import {DocumentView} from '../../types'

import styles from './tabs.css'

export function DocumentHeaderTabs(props: {
  activeViewId?: string
  idPrefix: string
  onSetActiveView: (id: string | null) => void
  views?: DocumentView[]
}) {
  const {activeViewId, idPrefix, onSetActiveView, views = []} = props
  const tabPanelId = `${idPrefix}tabpanel`

  return (
    <div className={styles.headerTabsContainer}>
      <TabList>
        {views.map((view, index) => (
          <DocumentHeaderTab
            icon={view.icon}
            id={`${idPrefix}tab-${view.id}`}
            isActive={activeViewId === view.id}
            key={view.id}
            label={<>{view.title}</>}
            onSetView={onSetActiveView}
            tabPanelId={tabPanelId}
            viewId={index === 0 ? null : view.id}
          />
        ))}
      </TabList>
    </div>
  )
}

function DocumentHeaderTab(props: {
  icon?: React.ComponentType<any>
  id: string
  isActive: boolean
  label: React.ReactNode
  onSetView: (id: string | null) => void
  tabPanelId: string
  viewId: string | null
}) {
  const handleClick = useCallback(() => props.onSetView(props.viewId), [
    props.onSetView,
    props.viewId,
  ])

  return (
    <Tab
      icon={props.icon}
      id={props.id}
      isActive={props.isActive}
      label={props.label}
      onClick={handleClick}
      aria-controls={props.tabPanelId}
    />
  )
}
