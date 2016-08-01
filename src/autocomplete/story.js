import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import faker from 'faker'
import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

const formStyle = {'width': '30em', 'margin': '0 auto', 'padding-bottom': '20em'}

storiesOf('Autocomplete')
  .addDecorator(centered)
  .addWithRole(
  'Default',
  `
    Default textfield
  `,
  'component:@sanity/components/autocomplete/default',
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete suggestions={false} placeholder="Type to autocomplete…"/>
      </form>
    )
  },
  {propTables: [Autocomplete]}
)

storiesOf('Autocomplete')
  .addDecorator(centered)
  .addWithRole(
  'Local search',
  `
    Default textfield
  `,
  'component:@sanity/components/autocomplete/default',
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
      <form style={formStyle}>
        <Autocomplete suggestions={false} placeholder="Type to autocomplete…" items={items}/>
      </form>
    )
  },
  {propTables: [Autocomplete]}
)

.addWithRole(
  'Default with suggestions',
  `
    Default textfield
  `,
  'component:@sanity/components/autocomplete/default',
  () => {

    const suggestions = range(10).map((item, i) => {
      return {
        id: `${i}`,
        title: faker.name.findName()
      }
    })
    return (
      <form style={formStyle}>
        <Autocomplete value="One" suggestions={suggestions} isOpen />
      </form>
    )
  },
  {propTables: [Autocomplete]}
)
