import React from 'react'
import Branding from '../components/Branding'

import NavBarStyles from '../components/styles/NavBar.css'
import DefaultLayoutStyles from '../components/styles/DefaultLayout.css'

export function BrandingStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavBarStyles.root}>
        <div className={NavBarStyles.branding}>
          <Branding />
        </div>
      </div>
    </div>
  )
}
