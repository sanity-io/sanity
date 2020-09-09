import React from 'react'
import {action} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import ToggleButton from 'part:@sanity/components/toggles/button'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

export function ToggleButtonStory() {
  const icon = boolean('icon', false) ? SanityLogoIcon : false

  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/toggles/buttons" propTables={[ToggleButtons]}>
        <ToggleButton
          selected={boolean('selected', false, 'props')}
          disabled={boolean('disabled', false, 'props')}
          onClick={action('onClick')}
          icon={icon || undefined}
        >
          {text('children', 'this is the content', 'props')}
        </ToggleButton>
      </Sanity>
    </div>
  )
}
