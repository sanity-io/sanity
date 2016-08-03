import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'

import DefaultList from 'component:@sanity/components/lists/default'
import DefaultListItem from 'component:@sanity/components/lists/items/default'
import ThumbsList from 'component:@sanity/components/lists/thumbs'
import Thumb from 'component:@sanity/components/lists/items/thumb'

import {range} from 'lodash'
import faker from 'faker'
import centered from '../storybook-addons/centered.js'
require('../storybook-addons/role.js')

const containerStyle = {
  'max-width': '40em',
  'max-height': '20em',
  'overflow-x': 'hidden',
  'overflow-y': 'auto',
  'box-shadow': '0 0 10px #ccc',
  'position': 'relative'
}


storiesOf('Lists')
.addDecorator(centered)
.addWithRole(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/lists/default',
  () => {
    const items = range(100).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName()
      }
    })
    return (
      <div style={containerStyle}>
        <DefaultList items={items} onSelect={action('onSelect')} />
      </div>
    )
  },
  {propTables: [DefaultList]}
)

.addWithRole(
  'Thumbs',
  `
    Showing landscape thumbs in a grid
  `,
  'component:@sanity/components/lists/thumbs',
  () => {
    const items = range(100).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable />
      </div>
    )
  },
  {propTables: [ThumbsList]}
)

.addWithRole(
  'Thumbs (portrait)',
  `
    Showing portrait thumbs in a grid
  `,
  'component:@sanity/components/lists/thumbs',
  () => {
    const items = range(100).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl(300, 500)}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable />
      </div>
    )
  },
  {propTables: [ThumbsList]}
)

.addWithRole(
  'Thumbs (mixed)',
  `
    Showing portrait thumbs in a grid
  `,
  'component:@sanity/components/lists/thumbs',
  () => {
    const items = range(100).map((item, i) => {
      const width = Math.round(Math.random() * 100)
      const height = Math.round(Math.random() * 100)
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl(width, height)}?${i}`,
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable />
      </div>
    )
  },
  {propTables: [ThumbsList]}
)

.addWithRole(
  'Thumbs (with info)',
  `
    Showing portrait thumbs in a grid
  `,
  'component:@sanity/components/lists/thumbs',
  () => {
    const items = range(100).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName(),
        image: `${faker.image.imageUrl()}?${i}`
      }
    })
    return (
      <div style={containerStyle}>
        <ThumbsList items={items} scrollable showInfo />
      </div>
    )
  },
  {propTables: [ThumbsList]}
)


storiesOf('Lists items')
  .addDecorator(centered)
  .addWithRole(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/lists/items/default',
  () => {
    const item = {
      id: '2',
      title: faker.name.findName()
    }
    return (
      <DefaultListItem title={item.title} id={item.id} />
    )
  },
  {propTables: [DefaultListItem]}
)
.addWithRole(
  'Thumb',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/lists/items/thumb',
  () => {
    const item = {
      id: '1',
      title: faker.name.findName(),
      image: `${faker.image.avatar()}?1`,
      action() {
        action('Clicked the single thumb')
      }
    }
    return (
      <Thumb title={item.title} id={item.id} image={item.image} action={item.action} />
    )
  },
  {propTables: [Thumb]}
)
.addWithRole(
  'Thumb with info',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/lists/items/thumb',
  () => {
    const item = {
      id: '1',
      title: faker.name.findName(),
      image: `${faker.image.avatar()}?1`,
      action() {
        action('Clicked the single thumb')
      }
    }
    return (
      <div style={{width: '300px'}}>
        <Thumb showInfo title={item.title} id={item.id} image={item.image} action={item.action} />
      </div>
    )
  },
  {propTables: [Thumb]}
)
