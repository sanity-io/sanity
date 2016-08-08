import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import DefaultTextField from 'component:@sanity/components/textfields/default'
import SearchTextField from 'component:@sanity/components/textfields/search'

storiesOf('Textfields')
  .addWithInfo(
  'Default',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('Changed')}
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'component:@sanity/components/textfields/default'
  }
)
.addWithInfo(
  'With value',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('Changed')}
        value="Donald Duck"
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'component:@sanity/components/textfields/default'
  }
)
.addWithInfo(
  'Default (with clear)',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        showClearButton
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'component:@sanity/components/textfields/default'
  }
)
.addWithInfo(
  'Default (error)',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        label="This is the label"
        placeholder="This is the placeholder"
        showClearButton
        error
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'component:@sanity/components/textfields/default'
  }
)
.addWithInfo(
  'Search',
  `
    Default searchfield
  `,
  () => {
    return (
      <SearchTextField
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange', 'more')}
      />
    )
  },
  {
    propTables: [SearchTextField],
    role: 'component:@sanity/components/textfields/search'
  }
)
