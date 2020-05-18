import React from 'react'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import ToolSwitcherWidget from '../components/ToolSwitcherWidget'
import ToolSwitcherItem from '../components/ToolSwitcherItem'

import NavBarStyles from '../components/styles/NavBar.css'
import DefaultLayoutStyles from '../components/styles/DefaultLayout.css'

export function ToolSwitcherStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavBarStyles.root}>
        <div className={NavBarStyles.toolSwitcher}>
          <ToolSwitcherWidget
            onSwitchTool={event => console.log('onSwitchTool()', event)}
            tools={[
              {
                name: 'Desk tool',
                icon: ViewColumnIcon
              },
              {
                name: 'Plugin 1',
                icon: PluginIcon
              },
              {
                name: 'Plugin 2',
                icon: PluginIcon
              }
            ]}
            renderItem={tool => <ToolSwitcherItem title={tool.name} icon={tool.icon} />}
          />
        </div>
      </div>
    </div>
  )
}
