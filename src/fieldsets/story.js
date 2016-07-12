import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import Faker from 'Faker'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

storiesOf('Fieldsets')
  .addDecorator(centered)
  .addWithRole(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  'component:@sanity/components/fieldsets/default',
  () => {
    return (
      <Fieldset legend="This is the legend" description={Faker.Lorem.paragraphs(1)}>
        Put content here
      </Fieldset>
    )
  },
  {inline: false, propTables: [Fieldset]}
)
.addWithRole(
  'Nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  'component:@sanity/components/fieldsets/default',
  () => {
    return (
      <Fieldset legend="This is the legend" description={Faker.Lorem.paragraphs(1)}>
        <Fieldset legend="This is the legend in a nested fieldset" description={Faker.Lorem.paragraphs(1)}>
          A nested fieldset
        </Fieldset>
      </Fieldset>
    )
  },
  {inline: false, propTables: [Fieldset]}
)
