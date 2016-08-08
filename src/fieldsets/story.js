import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import Fieldset from 'component:@sanity/components/fieldsets/default'
import faker from 'faker'

storiesOf('Fieldsets')
  .addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <Fieldset legend="This is the legend" description={faker.lorem.paragraphs(1)}>
        Put content here
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'component:@sanity/components/fieldsets/default'
  }
)
.addWithInfo(
  'Nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="This is the legend" description={faker.lorem.paragraphs(1)}>
        <Fieldset legend="This is the legend in a nested fieldset" description={faker.lorem.paragraphs(1)}>
          A nested fieldset
        </Fieldset>
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'component:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Crazy nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Dude, I heard you like fieldsets…" description={faker.lorem.paragraphs(1)}>
        <Fieldset legend="So I put a fieldset in a fieldset…" description={faker.lorem.paragraphs(1)}>
          <Fieldset legend="In a fieldset…" description={faker.lorem.paragraphs(1)}>
            <Fieldset legend="In a fieldset!" description={faker.lorem.paragraphs(1)} />
          </Fieldset>
        </Fieldset>
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'component:@sanity/components/fieldsets/default'
  }
)
