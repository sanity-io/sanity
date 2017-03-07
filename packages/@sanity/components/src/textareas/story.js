import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextArea from 'part:@sanity/components/textareas/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Text areas')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
      <DefaultTextArea
        placeholder={text('placehodler', 'This is the placeholder')}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        rows={number('rows', 2)}
        value={text('value')}
        id="ThisIsAnUniqueIdForTextArea"
        focus={boolean('focus', false)}
      />
    )
  },
  {
    propTables: [DefaultTextArea],
    role: 'part:@sanity/components/textinputs/default'
  }
)
