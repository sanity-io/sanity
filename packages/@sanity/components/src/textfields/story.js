import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import SearchTextField from 'part:@sanity/components/textfields/search'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  boxSizing: 'border-box',
  padding: '2rem',
  top: 0,
  left: 0
}

storiesOf('Textfields')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/textfields/default" propTables={[DefaultTextField]}>
          <DefaultTextField
            label={text('label', 'This is the label', 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            value={text('value', undefined, 'props')}
            hasError={boolean('hasError', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onClear={action('onClear')}
            isClearable={boolean('isClearable', false, 'props')}
            hasFocus={boolean('hasFocus', false, 'props')}
          />
        </Sanity>
      </div>
    )
  })
  .add('Spacing test', () => {
    return (
      <div style={{margin: '1rem'}}>
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
      </div>
    )
  })
