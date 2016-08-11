import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import DefaultSelect from 'component:@sanity/components/selects/default'
import SearchableSelect from 'component:@sanity/components/selects/searchable'

import {range} from 'lodash'
import faker from 'faker'

const items = range(100).map((item, i) => {
  return {
    title: faker.name.findName()
  }
})

storiesOf('Selects')
  .addWithInfo(
  'Default',
  `
    Default textfield
  `,
  () => {
    return (
      <DefaultSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'component:@sanity/components/selects/default'
  }
)
.addWithInfo(
  'Searchable local',
  `
    Default textfield
  `,
  () => {
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onChange')}
        onBlur={action('onBlur')}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'component:@sanity/components/selects/searchable'
  }
)
.addWithInfo(
  'Searchable ajax',
  `
    Default textfield
  `,
  () => {
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onSearch={action('onSearch')}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'component:@sanity/components/selects/searchable'
  }
)
