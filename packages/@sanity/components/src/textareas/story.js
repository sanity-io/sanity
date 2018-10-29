import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextArea from 'part:@sanity/components/textareas/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: 0,
  left: 0
}

storiesOf('Text areas')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextArea]}>
          <DefaultTextArea
            isClearable={boolean('isClearable', false, 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            onChange={action('onChange')}
            onClear={action('onClear')}
            onFocus={action('onFocus')}
            onKeyPress={action('onKeyPress')}
            onBlur={action('onBlur')}
            rows={number('rows', 2, 'props')}
            value={text('value', '', 'props')}
            disabled={boolean('disabled', false, 'props')}
            readOnly={boolean('readOnly', false, 'props')}
          />
        </Sanity>
      </div>
    )
  })
