import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import faker from 'faker'

const formStyle = {width: '30em', margin: '0 auto', paddingBottom: '20em'}

storiesOf('Autocomplete')
  .addWithInfo(
  'Default',
  `
    Autocomplete is used to help user complete a normal text input. The input can be anything.
  `,
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete placeholder="Type to autocomplete…" label="Autocomplete" onChange={action('onChange')} suggestions={[]} />
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
