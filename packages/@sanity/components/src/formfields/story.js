import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, number, text, boolean} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Form fields')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        label={text('Label', 'This is the label')}
        description={text('Description', 'This is the description')}
        labelHtmlFor={id}
        level={number('Level', 0)}
        inline={boolean('Inline', false)}
        wrapped={boolean('Wrapped', false)}
      >
        <DefaultTextInput id={id} value="" />
      </DefaultFormField>
    )
  },
  {
    propTables: [DefaultFormField],
    role: 'part:@sanity/components/formfields/default'
  }
)
