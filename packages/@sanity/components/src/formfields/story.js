import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Form fields')
  .addDecorator(withKnobs)
  .add('Default', () => {
    const id = 'storyFormField_Default1'
    return (
      <Sanity part="part:@sanity/components/formfields/default" propTables={[DefaultFormField]}>
        <DefaultFormField
          label={text('label (prop)', 'This is the label')}
          description={text('Description (prop)', 'This is the description')}
          level={number('Level (prop)', 0)}
          inline={boolean('Inline (prop)', false)}
          wrapped={boolean('Wrapped (prop)', false)}
        >
          <DefaultTextInput id={id} value="" />
        </DefaultFormField>
      </Sanity>
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
