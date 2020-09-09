import Tab from 'part:@sanity/components/tabs/tab'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import TabList from 'part:@sanity/components/tabs/tab-list'
import {action} from 'part:@sanity/storybook/addons/actions'
import {select} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

export function ManyStory() {
  const currentTabId = select(
    'Current tab',
    ['tab-edit', 'tab-seo', 'tab-preview'],
    'tab-edit',
    'props'
  )

  const tabs = [
    {id: 'tab-0', label: 'Foo'},
    {id: 'tab-1', label: 'Foo'},
    {id: 'tab-2', label: 'Foo'},
    {id: 'tab-3', label: 'Foo'},
    {id: 'tab-4', label: 'Foo'},
    {id: 'tab-5', label: 'Foo'},
    {id: 'tab-6', label: 'Foo'},
    {id: 'tab-7', label: 'Foo'},
    {id: 'tab-8', label: 'Foo'},
    {id: 'tab-9', label: 'Foo'},
    {id: 'tab-10', label: 'Foo'},
    {id: 'tab-11', label: 'Foo'},
    {id: 'tab-12', label: 'Foo'},
    {id: 'tab-13', label: 'Foo'},
    {id: 'tab-14', label: 'Foo'},
    {id: 'tab-15', label: 'Foo'},
    {id: 'tab-16', label: 'Foo'},
    {id: 'tab-17', label: 'Foo'},
    {id: 'tab-18', label: 'Foo'},
    {id: 'tab-19', label: 'Foo'},
    {id: 'tab-20', label: 'Foo'}
  ]

  return (
    <div style={{background: 'white'}}>
      <TabList>
        {tabs.map(tab => (
          <Tab
            aria-controls="tab-panel"
            id={tab.id}
            isActive={tab.id === currentTabId}
            key={tab.id}
            label={tab.label}
            onClick={action('onClick')}
          />
        ))}
      </TabList>
      <TabPanel aria-labelledby={currentTabId} id="tab-panel">
        <div style={{borderTop: '1px solid #eee', padding: '1em'}}>Content: {currentTabId}</div>
      </TabPanel>
    </div>
  )
}
