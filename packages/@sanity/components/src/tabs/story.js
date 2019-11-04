/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */

import React from 'react'
import Tab from 'part:@sanity/components/tab'
import TabPanel from 'part:@sanity/components/tab-panel'
import TabList from 'part:@sanity/components/tab-list'
import {storiesOf} from 'part:@sanity/storybook'
import {select, withKnobs} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Tabs', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    const currentTabId = select(
      'Current tab',
      ['tab-content', 'tab-seo', 'tab-preview'],
      'tab-content',
      'props'
    )
    const tabs = [
      {id: 'tab-content', label: 'Content'},
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
