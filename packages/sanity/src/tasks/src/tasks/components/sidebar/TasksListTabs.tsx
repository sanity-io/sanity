import {TabList, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {type CSSProperties} from 'styled-components'

import {Tab} from '../../../../../ui-components'
import {type SidebarTabsIds, useTasks} from '../../context'

const LIST_STYLES: CSSProperties = {
  marginLeft: '-0.5em',
  justifyContent: 'space-between',
  display: 'flex',
}

interface TasksListTabsProps {
  activeTabId: string
  onChange: (id: SidebarTabsIds) => void
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
  const [documentTabIsDisabled, setDocumentTabIsDisabled] = useState<boolean>(!activeDocumentId)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    // This effect is necessary to prevent the document tab from being disabled when the active document changes
    // As soon as the document changes, the activeDocumentId will be changed to null, then when the form for that
    // document is loaded, the activeDocumentId will be updated to the documentId of the document.
    // If we only depend on the `activeDocumentId` and the user is in the document tab, the tab will be disabled automatically
    // and then the user will have to select again the document tab to see the tasks for the document.
    // Even though this is not ideal, it is a better user experience than having the tab disabled automatically.
    if (!activeDocumentId && !documentTabIsDisabled) {
      timeoutId = setTimeout(() => {
        setDocumentTabIsDisabled(true)
        onChange('assigned')
      }, 1000)
    }

    if (documentTabIsDisabled && activeDocumentId) {
      setDocumentTabIsDisabled(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [activeDocumentId, documentTabIsDisabled, onChange])

  const tabs: TasksListTab[] = useMemo(
    () => [
      {
        id: 'assigned',
        label: 'Assigned',
      },
      {
        id: 'subscribed',
        label: 'Subscribed',
      },
      {
        id: 'document',
        label: 'Open Document',
        isDisabled: documentTabIsDisabled,
      },
    ],
    [documentTabIsDisabled],
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
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleTabChange(tab)}
          disabled={tab?.isDisabled}
          selected={tab.id === activeTabId}
        >
          <Text size={1} weight="medium">
            {tab.label}
          </Text>
        </Tab>
      ))}
    </TabList>
  )
}
