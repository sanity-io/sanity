import React from 'react'
import {text} from 'part:@sanity/storybook/addons/knobs'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import ToolSwitcherItem from '../navbar/toolMenu/ToolSwitcherItem'

import NavbarStyles from '../navbar/Navbar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

export function ToolSwitcherItemStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavbarStyles.root}>
        <div className={NavbarStyles.toolSwitcher}>
          <ToolSwitcherItem title={text('title (prop)', 'Desk tool')} icon={ViewColumnIcon} />
        </div>
      </div>
    </div>
  )
}
