import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import Faker from 'Faker'

storiesOf('Fieldsets').addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.

    Role
    component:@sanity/components/fieldsets/default
  `,
  () => {
    return (
      <form>
        <Fieldset legend="This is the legend" description="This is the description">
          Put content here
        </Fieldset>
      </form>
    )
  },
  {inline: true, propTables: [Fieldset]}
)
.addWithInfo(
  'Nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!

    Role
    component:@sanity/components/fieldsets/default
  `,
  () => {
    return (
      <form>
        <Fieldset legend="This is the legend" description="This is the description">
          <Fieldset legend="This is the legend" description="This is the description">
            A nested fieldset
          </Fieldset>
        </Fieldset>
      </form>
    )
  },
  {inline: true, propTables: [Fieldset]}
)
