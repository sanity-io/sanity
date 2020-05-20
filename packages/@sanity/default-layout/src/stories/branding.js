import React from 'react'
import Branding from '../navbar/branding/Branding'
import NavBarStyles from '../navbar/NavBar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

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
