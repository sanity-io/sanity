import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import RadioButton from 'part:@sanity/components/radiobutton/default'
import {withKnobs, object, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

storiesOf('Radiobutton')
  .addDecorator(withKnobs)
  .add('Default', () => {
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
  })
