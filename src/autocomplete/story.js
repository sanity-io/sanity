import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import faker from 'faker'

const formStyle = {'width': '30em', 'margin': '0 auto', 'padding-bottom': '20em'}

storiesOf('Autocomplete')
  .addWithInfo(
  'Default',
  `
    Autocomplete is used to help user complete a normal text input. The input can be anything.
  `,
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete placeholder="Type to autocomplete…" label="Autocomplete" />
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
        <Autocomplete placeholder="Type to autocomplete…" suggestions={items} label="Autocomplete" onSelect={action('onSelect')} />
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
        <Autocomplete value="One" suggestions={suggestions} isOpen label="Autocomplete component" onChange={action('onChange')} />
      </form>
    )
  },
  {propTables: [Autocomplete], role: 'component:@sanity/components/autocomplete/default'}
)
