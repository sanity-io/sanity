import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'

import faker from 'faker'

storiesOf('Form fields')
.addWithInfo(
  'Default',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        label="This is the label"
        description={faker.lorem.paragraphs(1)}
        labelHtmlFor={id}
      >
        <DefaultTextInput id={id} value="This is the children in form field" />
      </DefaultFormField>
    )
  },
  {
    propTables: [DefaultFormField],
    role: 'part:@sanity/components/formfields/default'
  }
)
.addWithInfo(
  'Inline',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        label="This is the label"
        description={faker.lorem.paragraphs(1)}
        labelHtmlFor={id}
        inline
      >
        <DefaultTextInput id={id} />
      </DefaultFormField>
    )
  },
  {
    propTables: [DefaultFormField],
    role: 'part:@sanity/components/formfields/default'
  }
)

.addWithInfo(
  'Wrapped',
  `
    Default with text, wrapped
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        label="This is the label"
        description={faker.lorem.paragraphs(1)}
        labelHtmlFor={id}
        wrapped
      >
        <DefaultTextInput id={id} />
      </DefaultFormField>
    )
  },
  {
    propTables: [DefaultFormField],
    role: 'part:@sanity/components/formfields/default'
  }
)
