import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  boxSizing: 'border-box',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

storiesOf('Form fields')
  .addDecorator(withKnobs)
  .add('Default', () => {
    const id = 'storyFormField_Default1'
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/formfields/default" propTables={[DefaultFormField]}>
          <DefaultFormField
            label={text('label', 'This is the label', 'props')}
            description={text('Description', 'This is the description', 'props')}
            level={number('Level', 0, {}, 'props')}
            inline={boolean('Inline', false, 'props')}
          >
            <DefaultTextInput id={id} value="" />
          </DefaultFormField>
        </Sanity>
      </div>
    )
  })
  .add('Spacing test', () => {
    return (
      <div style={{margin: '1rem'}}>
        <DefaultFormField label="Label" description="Description">
          <DefaultTextInput value="" />
        </DefaultFormField>
        <DefaultFormField label="Label" description="Description">
          <DefaultTextInput value="" />
        </DefaultFormField>
        <DefaultFormField label="Label" description="Description">
          <DefaultTextInput value="" />
        </DefaultFormField>
        <DefaultFormField label="Label" description="Description">
          <DefaultTextInput value="" />
        </DefaultFormField>
      </div>
    )
  })
