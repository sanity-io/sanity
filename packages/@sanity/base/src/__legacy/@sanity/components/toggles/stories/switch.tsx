import React from 'react'
import {action} from 'part:@sanity/storybook'
import Switch from 'part:@sanity/components/toggles/switch'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

export function SwitchStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/toggles/switch" propTables={[Switch]}>
        <Switch
          checked={boolean('undefined', false) ? undefined : boolean('checked', false, 'props')}
          label={text('label', 'This is the label', 'props')}
          description={text('description', 'This is the description', 'props')}
          disabled={boolean('disabled', false, 'props')}
          onChange={action('change')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
        />
      </Sanity>
    </div>
  )
}
