import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import DefaultList from 'component:@sanity/components/lists/default'
import {range} from 'lodash'
import Faker from 'Faker'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'


storiesOf('Lists')
.addDecorator(centered)
.addWithRole(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/fieldsets/default',
  () => {
    const items = range(10).map((item, i) => {
      return {
        id: `${i}`,
        title: Faker.Name.findName()
      }
    })
    return (
      <DefaultList items={items} />
    )
  },
  {propTables: [DefaultList]}
)
