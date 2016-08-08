import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import faker from 'faker'

const formStyle = {'width': '30em', 'margin': '0 auto', 'padding-bottom': '20em'}

storiesOf('Autocomplete')
  .addWithInfo(
  'Default',
  `
    Default textfield
  `,
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete suggestions={false} placeholder="Type to autocomplete…" />
      </form>
    )
  },
  {propTables: [Autocomplete], role: 'component:@sanity/components/autocomplete/default'}
)

storiesOf('Autocomplete')
  .addWithInfo(
  'Local search',
  `
    Default textfield
  `,
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
        <Autocomplete suggestions={false} placeholder="Type to autocomplete…" items={items} />
      </form>
    )
  },
  {propTables: [Autocomplete], role: 'component:@sanity/components/autocomplete/default'}
)

.addWithInfo(
  'Default with suggestions',
  `
    Default textfield
  `,
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
  {propTables: [Autocomplete], role: 'component:@sanity/components/autocomplete/default'}
)
