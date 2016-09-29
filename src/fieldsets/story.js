import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import faker from 'faker'

storiesOf('Fieldsets')
  .addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <Fieldset legend="This is the legend" description={faker.lorem.paragraphs(1)} level={0}>
        Put content here
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
.addWithInfo(
  'Nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="This is the legend" description={faker.lorem.paragraphs(1)} level={0}>
        <Fieldset legend="This is the legend in a nested fieldset" description={faker.lorem.paragraphs(1)} level={1}>
          A nested fieldset
        </Fieldset>
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Crazy nested',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Dude, I heard you like fieldsets…" description={faker.lorem.paragraphs(1)} level={0}>
        <Fieldset legend="So I put a fieldset in a fieldset…" description={faker.lorem.paragraphs(1)} level={1}>
          <Fieldset legend="In a fieldset…" description={faker.lorem.paragraphs(1)} level={2}>
            <Fieldset legend="In a fieldset!" description={faker.lorem.paragraphs(1)} level={3} />
          </Fieldset>
        </Fieldset>
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'No decription',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Low letters, yjg, can not TOUCH!" level={0}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
