import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import RadioButton from 'part:@sanity/components/radiobutton/default'
import {withKnobs, object, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Radiobutton')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/radiobutton/default" propTables={[RadioButton]}>
        <RadioButton
          name="radioButton"
          label={text('label (prop)', 'Label')}
          item={object('Item (prop)', {title: 'test'})}
          checked={boolean('checked (prop)', false)}
          onChange={action('onChange')}
        />
      </Sanity>
    )
  })
