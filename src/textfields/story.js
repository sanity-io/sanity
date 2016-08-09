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
        onChange={action('onChange')}
        onFocus={action('onFocus')}
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
        onChange={action('onChange')}
        onFocus={action('onFocus')}
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
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onClear={action('onClear')}
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
