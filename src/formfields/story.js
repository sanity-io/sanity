import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'

import DefaultFormField from 'component:@sanity/components/formfields/default'
import DefaultTextInput from 'component:@sanity/components/textinputs/default'

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
        <DefaultTextInput id={id} />
      </DefaultFormField>
    )
  },
  {
    propTables: [DefaultFormField],
    role: 'component:@sanity/components/formfields/default'
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
    role: 'component:@sanity/components/formfields/default'
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
    role: 'component:@sanity/components/formfields/default'
  }
)
