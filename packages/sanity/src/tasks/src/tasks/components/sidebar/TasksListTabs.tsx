import {TabList} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState} from 'react'
import {type CSSProperties} from 'styled-components'

import {Tab} from '../../../../../ui-components'
import {useTasks} from '../../context'
import {type SidebarTabsIds} from './types'

const LIST_STYLES: CSSProperties = {marginLeft: '-0.5em'}

interface TasksListTabsProps {
  activeTabId: string
  onChange: Dispatch<SetStateAction<SidebarTabsIds>>
}

interface TasksListTab {
  id: SidebarTabsIds
  label: string
  isDisabled?: boolean
}

/**
 * @internal
 */
export function TasksListTabs({activeTabId, onChange}: TasksListTabsProps) {
  const {activeDocument} = useTasks()
  const activeDocumentId = activeDocument?.documentId
  const [isDisabledTab, setIsDisabledTab] = useState<boolean>(!activeDocumentId)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (!activeDocumentId && !isDisabledTab) {
      timeoutId = setTimeout(() => {
        setIsDisabledTab(true)
        onChange('assigned')
      }, 1000)
    }

    if (isDisabledTab && activeDocumentId) {
      setIsDisabledTab(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [activeDocumentId, isDisabledTab, onChange])

  const tabs: TasksListTab[] = useMemo(
    () => [
      {
        id: 'assigned',
        label: 'Assigned',
      },
      {
        id: 'created',
        label: 'Created',
      },
      {
        id: 'document',
        label: 'This document',
        isDisabled: isDisabledTab,
      },
    ],
    [isDisabledTab],
  )

  const handleTabChange = useCallback(
    (tab: TasksListTab) => {
      if (tab.isDisabled) {
        return
      }

      onChange(tab.id)
    },
    [onChange],
  )

  return (
    <TabList space={2} style={LIST_STYLES}>
      {tabs.map((tab) => (
        <Tab
          key={`${tab.id}-tab`}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          label={tab.label}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleTabChange(tab)}
          selected={activeTabId === tab.id}
          disabled={tab?.isDisabled}
        />
      ))}
    </TabList>
  )
}
