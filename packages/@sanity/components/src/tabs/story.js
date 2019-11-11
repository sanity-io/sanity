/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */

import React from 'react'
import Tab from 'part:@sanity/components/tabs/tab'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import TabList from 'part:@sanity/components/tabs/tab-list'
import {storiesOf} from 'part:@sanity/storybook'
import {select, withKnobs} from 'part:@sanity/storybook/addons/knobs'

// Import icons
import EyeIcon from 'part:@sanity/base/eye-icon'
import EditIcon from 'part:@sanity/base/edit-icon'

storiesOf('Tabs', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
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
              onClick={() => console.log('click tab')}
            />
          ))}
        </TabList>
        <TabPanel aria-labelledby={currentTabId} id="tab-panel">
          <div style={{borderTop: '1px solid #ddd', padding: '1em'}}>Content: {currentTabId}</div>
        </TabPanel>
      </div>
    )
  })
  .add('With icons', () => {
    const currentTabId = select(
      'Current tab',
      ['tab-edit', 'tab-seo', 'tab-preview'],
      'tab-edit',
      'props'
    )
    const tabs = [
      {icon: EditIcon, id: 'tab-edit', label: 'Content'},
      {id: 'tab-seo', label: 'SEO'},
      {icon: EyeIcon, id: 'tab-preview', label: 'Preview'}
    ]
    return (
      <div style={{background: 'white'}}>
        <TabList>
          {tabs.map(tab => (
            <Tab
              aria-controls="tab-panel"
              icon={tab.icon}
              id={tab.id}
              isActive={tab.id === currentTabId}
              key={tab.id}
              label={tab.label}
              onClick={() => console.log('click tab')}
            />
          ))}
        </TabList>
        <TabPanel aria-labelledby={currentTabId} id="tab-panel">
          <div style={{borderTop: '1px solid #eee', padding: '1em'}}>Content: {currentTabId}</div>
        </TabPanel>
      </div>
    )
  })
