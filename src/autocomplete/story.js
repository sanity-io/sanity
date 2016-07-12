import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Autocomplete from 'component:@sanity/components/autocomplete/default'
import {range} from 'lodash'
import Faker from 'Faker'
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
        title: Faker.Name.findName()
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
