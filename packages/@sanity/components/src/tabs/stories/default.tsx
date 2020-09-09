import Tab from 'part:@sanity/components/tabs/tab'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import TabList from 'part:@sanity/components/tabs/tab-list'
import {action} from 'part:@sanity/storybook/addons/actions'
import {select} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'

export function DefaultStory() {
  const currentTabId = select(
    'Current tab',
    ['tab-edit', 'tab-seo', 'tab-preview'],
    'tab-edit',
    'props'
  )

  const tabs = [
    {id: 'tab-edit', label: 'Edit'},
    {id: 'tab-seo', label: 'SEO'},
    {id: 'tab-preview', label: 'Preview'}
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
        <div style={{borderTop: '1px solid #ddd', padding: '1em'}}>Content: {currentTabId}</div>
      </TabPanel>
    </div>
  )
}
