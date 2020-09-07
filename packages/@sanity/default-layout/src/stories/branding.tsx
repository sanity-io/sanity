import React from 'react'
import Branding from '../navbar/branding/Branding'
import NavbarStyles from '../navbar/Navbar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

export function BrandingStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavbarStyles.root}>
        <div className={NavbarStyles.branding}>
          <Branding projectName="Storybook" />
        </div>
      </div>
    </div>
  )
}
