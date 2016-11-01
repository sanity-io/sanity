import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'

import Chance from 'chance'
const chance = new Chance()


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
        description={chance.paragraph()}
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
        description={chance.paragraph()}
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
        description={chance.paragraph()}
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
.addWithInfo(
  'Level 0',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        level="0"
        label="This is the label"
        description={chance.paragraph()}
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
  'Level 1',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        level="1"
        label="This is the label"
        description={chance.paragraph()}
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
  'Level 2',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        level="2"
        label="This is the label"
        description={chance.paragraph()}
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
  'Level 3',
  `
    Default with text
  `,
  () => {
    const id = 'storyFormField_Default1'
    return (
      <DefaultFormField
        level="3"
        label="This is the label"
        description={chance.paragraph()}
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
