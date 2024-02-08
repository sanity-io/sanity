import {Box, Card, TabList} from '@sanity/ui'
import {TaskDocument} from '../../types'
import {useCallback, useMemo, useState} from 'react'
import {useCurrentUser} from '../../../../store'
import {Tab} from '../../../../../ui-components'
import {TaskList} from '../list/TaskList'
import {useTasks} from '../../context'

interface TaskListTabsProps {
  activeTabId: string
  onChange: (id: string) => void
}

interface TaskListTab {
  id: string
  label: string
}

export function TaskListTabs({activeTabId, onChange}: TaskListTabsProps) {
  const {activeDocumentId} = useTasks()
  const tabs: TaskListTab[] = useMemo(() => {
    const defaultTabs = [
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

  const handleTabChange = useCallback(
    (id: string) => {
      onChange(id)
    },
    [onChange],
  )

  return (
    <TabList space={2}>
      {tabs.map((tab) => (
        <Tab
          key={`${tab.id}-tab`}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          label={tab.label}
          onClick={() => handleTabChange(tab.id)}
          selected={activeTabId === tab.id}
        />
      ))}
    </TabList>
  )
}
