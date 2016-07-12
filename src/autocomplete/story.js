import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import Faker from 'Faker'

const formStyle = {'width': '30em', 'margin': '0 auto', 'padding-bottom': '20em'}

storiesOf('Autocomplete').addWithInfo(
  'Default',
  `
    Default textfield
  `,
  () => {
    return (
      <form style={formStyle}>
        <Autocomplete suggestions={false} placeholder="Type to autocomplete…"/>
      </form>
    )
  },
  {inline: true, propTables: [Autocomplete]}
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
        title: Faker.Name.findName()
      }
    })
    return (
      <form style={formStyle}>
        <Autocomplete value="One" suggestions={suggestions} isOpen />
      </form>
    )
  },
  {inline: true, propTables: [Autocomplete]}
)
