import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextArea from 'part:@sanity/components/textareas/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Text areas')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextArea]}>
        <DefaultTextArea
          isClearable={boolean('isClearable (prop)', false)}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          onChange={action('onChange')}
          onClear={action('onClear')}
          onFocus={action('onFocus')}
          onKeyPress={action('onKeyPress')}
          onBlur={action('onBlur')}
          rows={number('rows (prop)', 2)}
          value={text('value (prop)')}
          disabled={boolean('disabled (prop)', false)}
        />
      </Sanity>
    )
  })
