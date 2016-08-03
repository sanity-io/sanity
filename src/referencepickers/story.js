import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import ReferencePickerDefault from 'component:@sanity/components/referencepickers/default'
import DefaultDialog from 'component:@sanity/components/dialogs/default'

import {range} from 'lodash'
import faker from 'faker'

import centered from '../storybook-addons/centered.js'
require('../storybook-addons/role.js')


storiesOf('Reference picker')
.addDecorator(centered)
.addWithRole(
  'Default',
  `
    The default reference picker
  `,
  'component:@sanity/components/referencepickers/default',
  () => {
    const items = range(50).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={{height: '30em'}}>
        <ReferencePickerDefault items={items} onSearch={action('Search')} />
      </div>
    )
  },
  {propTables: [ReferencePickerDefault]}
)
.addWithRole(
  'In dialog',
  `
    The default reference picker
  `,
  'component:@sanity/components/referencepickers/default',
  () => {
    const items = range(100).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    const actions = [
      {
        title: 'Finished',
        id: '1',
        action: () => {
          action('Ok, Close')
        }
      }
    ]
    return (
      <DefaultDialog title="Reference picker" onClose={action('Close')} isOpen showHeader actions={actions}>
        <ReferencePickerDefault items={items} />
      </DefaultDialog>
    )
  },
  {propTables: [ReferencePickerDefault]}
)
