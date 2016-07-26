import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'

import DefaultList from 'component:@sanity/components/lists/default'
import DefaultListItem from 'component:@sanity/components/lists/items/default'

import ThumbsList from 'component:@sanity/components/lists/thumbs'
import Thumb from 'component:@sanity/components/lists/items/thumb'

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
  'component:@sanity/components/lists/default',
  () => {
    const items = range(500).map((item, i) => {
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
        title: Faker.Name.findName(),
        image: `${Faker.Image.imageUrl()}?${i}`
      }
    })
    return (
      <ThumbsList items={items} scrollable />
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
        title: Faker.Name.findName(),
        image: `${Faker.Image.imageUrl(300, 500)}?${i}`
      }
    })
    return (
      <ThumbsList items={items} scrollable />
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
        title: Faker.Name.findName(),
        image: `${Faker.Image.imageUrl(width, height)}?${i}`,
      }
    })
    return (
      <ThumbsList items={items} scrollable />
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
        title: Faker.Name.findName(),
        image: `${Faker.Image.imageUrl()}?${i}`
      }
    })
    return (
      <ThumbsList items={items} scrollable showInfo />
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
      title: Faker.Name.findName()
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
      title: Faker.Name.findName(),
      image: `${Faker.Image.avatar()}?1`,
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
      title: Faker.Name.findName(),
      image: `${Faker.Image.avatar()}?1`,
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
