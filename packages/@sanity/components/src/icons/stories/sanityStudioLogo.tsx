import React from 'react'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import {color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

export function SanityStudioLogoStory() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        color: color('color', '#fff'),
        backgroundColor: color('background', '#f43')
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '50vh',
          width: '50vw',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Sanity part="part:@sanity/base/sanity-studio-logo" propTables={[SanityStudioLogo]}>
          <SanityStudioLogo />
        </Sanity>
      </div>
    </div>
  )
}
