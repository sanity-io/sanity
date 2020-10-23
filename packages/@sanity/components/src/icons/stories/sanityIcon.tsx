import React from 'react'
import {color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

export function SanityIconStory() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        color: color('color', '#fff'),
        backgroundColor: color('background', '#f43'),
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '50vh',
          width: '50vw',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Sanity part="part:@sanity/base/sanity-logo-icon" propTables={[SanityLogoIcon]}>
          <SanityLogoIcon />
        </Sanity>
      </div>
    </div>
  )
}
