import React from 'react'
import {action} from 'part:@sanity/storybook/addons/actions'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import ToolSwitcherWidget from '../navbar/toolMenu/ToolSwitcherWidget'
import ToolSwitcherItem from '../navbar/toolMenu/ToolSwitcherItem'

import NavBarStyles from '../navbar/NavBar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

export function ToolSwitcherStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavBarStyles.root}>
        <div className={NavBarStyles.toolSwitcher}>
          <ToolSwitcherWidget
            onSwitchTool={event => action('onSwitchTool')}
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
