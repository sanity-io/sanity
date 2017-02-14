import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import Chance from 'chance'
const chance = new Chance()


storiesOf('Fieldsets')
  .addWithInfo(
  'Default',
  `
    The default fieldset is used to gather a collection of fields.
  `,
  () => {
    return (
      <Fieldset legend="This is the legend" description={chance.paragraph()} level={0}>
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
      <Fieldset legend="This is the legend" description="Fieldsets supports beeing inside itselfs, and get new styling!" level={0}>
        <Fieldset legend="This is the legend in a nested fieldset" description={chance.paragraph()} level={1}>
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
      <Fieldset legend="Dude, I heard you like fieldsets…" description={chance.paragraph()} level={0}>
        <Fieldset legend="So I put a fieldset in a fieldset…" description={chance.paragraph()} level={1}>
          <Fieldset legend="In a fieldset…" description={chance.paragraph()} level={2}>
            <Fieldset legend="In a fieldset!" description={chance.paragraph()} level={3}>
              <Fieldset legend="In a fieldset!" description={chance.paragraph()} level={4} />
            </Fieldset>
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
  'Collapsable',
  `
    Fieldsets can be collapsed
  `,
  () => {
    return (
      <div>
        <Fieldset collapsable legend="Noooo, pick me, pick me!" description={chance.sentence()} level={0}>
          <DefaultTextField label="Content" level={1} />
          <DefaultTextField label="Content" level={1} description="Test this one" />
          <DefaultTextField label="Content" level={1} />
          <DefaultTextField label="Content" level={1} />
        </Fieldset>
        <Fieldset legend="Fieldsets can be collapsed" description={chance.sentence()} level={0}>
          <Fieldset collapsable legend="Open me" description={chance.sentence()} level={1}>
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} description="Test this one" />
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset collapsable legend="No, open me!" description={chance.sentence()} level={1}>
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} description="Test this one" />
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset collapsable legend="Noooo, pick me, pick me!" description={chance.sentence()} level={1}>
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} description="Test this one" />
            <DefaultTextField label="Content" level={2} />
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
      </div>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Columns',
  `
    Columns
  `,
  () => {
    return (
      <Fieldset legend="3 columns" columns={3} description={chance.paragraph()} level={0}>
        <Fieldset legend="Test" description={chance.paragraph()} level={1} />
        <Fieldset legend="Test 2" description={chance.paragraph()} level={1} />
        <Fieldset legend="Test 3" description={chance.paragraph()} level={1} />
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

.addWithInfo(
  'Level 0',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Level 0" level={0}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Level 1',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Level 1" level={1}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Level 2',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Level 2" level={2}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Level 3',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Level 3" level={3}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.addWithInfo(
  'Level 4',
  `
    Fieldsets supports beeing inside itselfs, and get new styling!
  `,
  () => {
    return (
      <Fieldset legend="Level 4" level={4}>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
.addWithInfo(
  'Transparent',
  `
  test
  `,
  () => {
    return (
      <Fieldset legend="Transparent" transparent>
        This fieldset has no description
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
.addWithInfo(
  'Example',
  `
    A mix of fieldsets
  `,
  () => {
    return (
      <div style={{margin: '10px'}}>
        <Fieldset legend="Level 0" >
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
        <Fieldset legend="Level 0" description="This is the desription" level={0}>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
        <Fieldset collapsable legend="Collapsable Level 0" level={0}>
          <DefaultTextField label="Content" level={1} />
        </Fieldset>
        <Fieldset collapsable legend="Collapsable Level 0, 2 columns" level={0} columns={2}>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
        <Fieldset legend="Level 0 with 2 columns" description="This is the desription" level={0} columns={2}>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
        <Fieldset legend="Level 0 with 3 columns" description="This is the desription" level={0} columns={3}>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" description="This is the desription" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
        </Fieldset>
        <Fieldset legend="Level 0 with 2 columns. No desriptions" level={0} columns={2}>
          <Fieldset legend="Level 1" level={1}><DefaultTextField label="Content" level={1} /></Fieldset>
          <Fieldset legend="Level 1" level={1}><DefaultTextField label="Content" level={1} /></Fieldset>
          <Fieldset legend="Level 1" level={1}><DefaultTextField label="Content" level={1} /></Fieldset>
          <Fieldset legend="Level 1" level={1}><DefaultTextField label="Content" level={1} /></Fieldset>
        </Fieldset>

        <Fieldset legend="Level 0 with 2 columns. Collapsable" level={0} columns={2}>
          <Fieldset collapsable legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
          <Fieldset collapsable legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
          <Fieldset collapsable legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
          <Fieldset collapsable legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
        </Fieldset>

        <Fieldset legend="Level 0 with 3 columns. No desriptions" level={0} columns={3}>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={2} />
          </Fieldset>
        </Fieldset>
        <Fieldset legend="Level 0 with 2 columns. No desriptions" level={0} columns={2}>
          <DefaultTextField label="Content" level={1} />
          <DefaultTextField label="Content" level={1} />
          <DefaultTextField label="Content" level={1} />
        </Fieldset>
        <Fieldset legend="This is messy" level={0} columns={2} description="A real life example of how messy things can get">
          <Fieldset legend="Level 1" level={1} description="This is someething with a description">
            <DefaultTextField label="Content" level={1} />
            <DefaultTextField label="Content" level={1} description="Descrption here" />
          </Fieldset>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={1} />
            <DefaultTextField label="Content" level={1} description="Test this one" />
            <DefaultTextField label="Content" level={1} />
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset legend="Level 1" level={1}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
        </Fieldset>
      </div>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
