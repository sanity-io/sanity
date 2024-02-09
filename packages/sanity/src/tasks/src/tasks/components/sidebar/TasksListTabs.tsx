import {Dispatch, SetStateAction, useMemo} from 'react'
import {TabList} from '@sanity/ui'
import {Tab} from '../../../../../ui-components'
import {useTasks} from '../../context'
import {SidebarTabsIds} from './types'

interface TasksListTabsProps {
  activeTabId: string
  onChange: Dispatch<SetStateAction<SidebarTabsIds>>
}

interface TasksListTab {
  id: SidebarTabsIds
  label: string
}

/**
 * @internal
 */
export function TasksListTabs({activeTabId, onChange}: TasksListTabsProps) {
  const {activeDocumentId} = useTasks()
  const tabs: TasksListTab[] = useMemo(() => {
    const defaultTabs: TasksListTab[] = [
      {
        id: 'assigned',
        label: 'Assigned',
      },
      {
        id: 'created',
        label: 'Created',
      },
    ]

    if (activeDocumentId) {
      return [
        ...defaultTabs,
        {
          id: 'document',
          label: 'This document',
        },
      ]
    }
    return defaultTabs
  }, [activeDocumentId])

  return (
    <TabList space={2}>
      {tabs.map((tab) => (
        <Tab
          key={`${tab.id}-tab`}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          label={tab.label}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => onChange(tab.id)}
          selected={activeTabId === tab.id}
        />
      ))}
    </TabList>
  )
}
