import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import SearchTextField from 'part:@sanity/components/textfields/search'

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
    role: 'part:@sanity/components/textfields/default'
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
    role: 'part:@sanity/components/textfields/default'
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
    role: 'part:@sanity/components/textfields/default'
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
    role: 'part:@sanity/components/textfields/default'
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
    role: 'part:@sanity/components/textfields/search'
  }
)

.addWithInfo(
  'Default (level 0)',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        level="0"
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'part:@sanity/components/textfields/default'
  }
)

.addWithInfo(
  'Default (level 1)',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultTextField
        level="1"
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
      />
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'part:@sanity/components/textfields/default'
  }
)
