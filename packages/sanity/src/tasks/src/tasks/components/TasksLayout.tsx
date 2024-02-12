import {TabList} from '@sanity/ui'
import {Tab} from '../../../../ui-components'
import {TasksLayoutProps} from './sidebar/types'

export function TasksLayout({activeTabId, onChange, tabs}: TasksLayoutProps) {
  return (
    <TabList space={1}>
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
