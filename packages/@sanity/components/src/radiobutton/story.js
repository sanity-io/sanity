import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import RadioButton from 'part:@sanity/components/radiobutton/default'
import {withKnobs, object, boolean, text} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Radiobutton')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
      <RadioButton
        name="radioButton"
        label={text('label', 'Label')}
        item={object('Item', {title: 'test'})}
        checked={boolean('checked', false)}
        onChange={action('onChange')}
      />
    )
  },
  {propTables: [RadioButton], role: 'part:@sanity/components/radiobutton/default'}
)
