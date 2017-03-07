import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import Autocomplete from 'part:@sanity/components/autocomplete/default'
import {range} from 'lodash'

import Chance from 'chance'
const chance = new Chance()

const formStyle = {width: '30em', margin: '0 auto', paddingBottom: '20em'}

storiesOf('Autocomplete')
  .add(
  'Default',
  // `
  //   Autocomplete is used to help user complete a normal text input. The input can be anything.
  // `,
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete placeholder="Type to autocomplete…" label="Autocomplete" onChange={action('onChange')} suggestions={[]} />
      </form>
    )
  },
  {propTables: [Autocomplete], role: 'part:@sanity/components/autocomplete/default'}
)

.add(
  'Default with suggestions',
  // `
  //   Default textfield
  // `,
  () => {

    const suggestions = range(10).map((item, i) => {
      return {
        id: `${i}`,
        title: chance.name()
      }
    })
    return (
      <form style={formStyle}>
        <Autocomplete value="One" suggestions={suggestions} isOpen label="Autocomplete component" onChange={action('onChange')} />
      </form>
    )
  },
  {propTables: [Autocomplete], role: 'part:@sanity/components/autocomplete/default'}
)
