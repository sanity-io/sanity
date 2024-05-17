import {TabList, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {type CSSProperties} from 'styled-components'

import {Tab} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type SidebarTabsIds} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'

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
}

/**
 * @internal
 */
export function TasksListTabs({activeTabId, onChange}: TasksListTabsProps) {
  const {t} = useTranslation(tasksLocaleNamespace)

  const tabs: TasksListTab[] = useMemo(
    () => [
      {
        id: 'assigned',
        label: t('tab.assigned.label'),
      },
      {
        id: 'subscribed',
        label: t('tab.subscribed.label'),
      },
      {
        id: 'document',
        label: t('tab.document.label'),
      },
    ],
    [t],
  )

  const handleTabChange = useCallback(
    (tab: TasksListTab) => {
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
