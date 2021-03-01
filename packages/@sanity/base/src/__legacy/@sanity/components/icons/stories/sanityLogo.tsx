import React from 'react'
import SanityLogo from 'part:@sanity/base/sanity-logo'
import {color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

export function SanityLogoStory() {
  return (
    <CenteredContainer
      style={{
        color: color('color', '#fff'),
        backgroundColor: color('background', '#f43'),
      }}
    >
      <div style={{width: '100%', maxWidth: 320}}>
        <Sanity part="part:@sanity/base/sanity-logo" propTables={[SanityLogo]}>
          <SanityLogo />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
