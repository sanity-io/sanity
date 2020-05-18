import React from 'react'
import {text} from 'part:@sanity/storybook/addons/knobs'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import ToolSwitcherItem from '../components/ToolSwitcherItem'

import NavBarStyles from '../components/styles/NavBar.css'
import DefaultLayoutStyles from '../components/styles/DefaultLayout.css'

export function ToolSwitcherItemStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavBarStyles.root}>
        <div className={NavBarStyles.toolSwitcher}>
          <ToolSwitcherItem title={text('title (prop)', 'Desk tool')} icon={ViewColumnIcon} />
        </div>
      </div>
    </div>
  )
}
