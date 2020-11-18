import React from 'react'
import {color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

import SanityLogoAlpha from 'part:@sanity/base/sanity-logo-alpha'

export function SanityAlphaStory() {
  return (
    <Sanity part="part:@sanity/base/sanity-logo-alpha" propTables={[SanityLogoAlpha]}>
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
          <SanityLogoAlpha />
        </div>
      </div>
    </Sanity>
  )
}
