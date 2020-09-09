import React from 'react'
import {action} from 'part:@sanity/storybook'
import ToggleButton from 'part:@sanity/components/toggles/button'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

const centerStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}

export function ToggleButtonCollectionStory() {
  return (
    <div style={centerStyle}>
      <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
      <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
      <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
      <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
    </div>
  )
}
