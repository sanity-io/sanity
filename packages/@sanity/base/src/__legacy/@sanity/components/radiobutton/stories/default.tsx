import RadioButton from 'part:@sanity/components/radiobutton/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {object, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
}

export function DefaultStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/radiobutton/default" propTables={[RadioButton]}>
        <RadioButton
          name="radioButton"
          label={text('label', 'Label', 'props')}
          item={object('Item', {title: 'test'}, 'props')}
          checked={boolean('checked', false, 'props')}
          onChange={action('onChange')}
        />
      </Sanity>
    </div>
  )
}
