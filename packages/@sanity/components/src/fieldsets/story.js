import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, number, boolean} from 'part:@sanity/storybook/addons/knobs'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import Chance from 'chance'
const chance = new Chance()


storiesOf('Fieldsets')
  .addDecorator(withKnobs)
  .add(
  'Default',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <Fieldset
        legend={text('legend', 'This is the legend')}
        description={text('description', 'This is the description')}
        level={number('level', 0)}
        transparent={boolean('transparent', false)}
      >
        {text('content', 'Put content here')}
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)
.add(
  'Nested',
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

.add(
  'Crazy nested',
  // `
  //   Fieldsets supports beeing inside itselfs, and get new styling!
  // `,
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

.add(
  'Collapsable',
  () => {
    const level = number('start level', 0)
    const collapsable = boolean('collapsable', true)
    return (
      <div>
        <Fieldset collapsable={collapsable} legend="Noooo, pick me, pick me!" description={chance.sentence()} level={level}>
          <DefaultTextField label="Content" level={level + 1} />
          <DefaultTextField label="Content" level={level + 1} description="Test this one" />
          <DefaultTextField label="Content" level={level + 1} />
          <DefaultTextField label="Content" level={level + 1} />
        </Fieldset>
        <Fieldset legend="Fieldsets can be collapsed" description={chance.sentence()} level={level}>
          <Fieldset collapsable={collapsable} legend="Open me" description={chance.sentence()} level={level + 1}>
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} description="Test this one" />
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} />
          </Fieldset>
          <Fieldset collapsable={collapsable} legend="No, open me!" description={chance.sentence()} level={level + 1}>
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} description="Test this one" />
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} />
          </Fieldset>
          <Fieldset collapsable={collapsable} legend="Noooo, pick me, pick me!" description={chance.sentence()} level={level + 1}>
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} description="Test this one" />
            <DefaultTextField label="Content" level={level + 2} />
            <DefaultTextField label="Content" level={level + 2} />
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

.add(
  'Columns',
  () => {
    const columns = number('columns', 3)
    const level = number('start level', 0)
    return (
      <Fieldset
        legend={`${columns}columns`}
        columns={columns}
        description={chance.paragraph()}
        level={level}
      >
        <Fieldset legend="Test" description={chance.paragraph()} level={level + 1} />
        <Fieldset legend="Test 2" description={chance.paragraph()} level={level + 1} />
        <Fieldset legend="Test 3" description={chance.paragraph()} level={level + 1} />
      </Fieldset>
    )
  },
  {
    propTables: [Fieldset],
    role: 'part:@sanity/components/fieldsets/default'
  }
)

.add(
  'Example',
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
