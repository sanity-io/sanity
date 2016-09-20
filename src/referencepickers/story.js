import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import ReferencePickerDefault from 'part:@sanity/components/referencepickers/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'

import {range} from 'lodash'
import faker from 'faker'

storiesOf('Reference picker')
.addWithInfo(
  'Default',
  `
    The default reference picker
  `,
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
        <ReferencePickerDefault items={items} />
      </div>
    )
  },
  {
    propTables: [ReferencePickerDefault],
    role: 'part:@sanity/components/referencepickers/default'
  }
)
.addWithInfo(
  'With search',
  `
    The default reference picker
  `,
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
  {
    propTables: [ReferencePickerDefault],
    role: 'part:@sanity/components/referencepickers/default'
  }
)

.addWithInfo(
  'In dialog',
  `
    The default reference picker
  `,
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
  {
    propTables: [ReferencePickerDefault],
    role: 'part:@sanity/components/referencepickers/default'
  }
)
