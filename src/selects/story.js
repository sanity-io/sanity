import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import DefaultSelect from 'component:@sanity/components/selects/default'

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
        onChange={action('Changed')}
        onFocus={action('Focused')}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'component:@sanity/components/selects/default'
  }
)
