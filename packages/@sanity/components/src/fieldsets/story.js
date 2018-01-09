import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, number, boolean} from 'part:@sanity/storybook/addons/knobs'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import Chance from 'chance'
const chance = new Chance()
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Fieldsets')
  .addDecorator(withKnobs)
  .add(
  'Default',
  // `
  //   The default fieldset is used to gather a collection of fields.
  // `,
  () => {
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <Fieldset
          legend={text('legend (prop)', 'This is the legend')}
          description={text('description (prop)', 'This is the description')}
          level={number('level (prop)', 1)}
          transparent={boolean('transparent (prop)', false)}
        >
          {text('children (prop)', 'Put content here')}
        </Fieldset>
      </Sanity>
    )
  }
)
.add(
  'Nested (demo)',
  () => {
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <Fieldset
          legend="This is the legend"
          description="Fieldsets supports beeing inside itselfs, and get new styling!"
          level={0}
        >
          <Fieldset
            legend="This is the legend in a nested fieldset"
            description={chance.paragraph()} level={1}
          >
            A nested fieldset
          </Fieldset>
        </Fieldset>
      </Sanity>
    )
  }
)

.add(
  'Crazy nested (demo)',
  // `
  //   Fieldsets supports beeing inside itselfs, and get new styling!
  // `,
  () => {
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <Fieldset legend="Dude, I heard you like fieldsets…" description={chance.paragraph()} level={0}>
          <Fieldset legend="So I put a fieldset in a fieldset…" description={chance.paragraph()} level={1}>
            <Fieldset legend="In a fieldset…" description={chance.paragraph()} level={2}>
              <Fieldset legend="In a fieldset!" description={chance.paragraph()} level={3}>
                <Fieldset legend="In a fieldset!" description={chance.paragraph()} level={4} />
              </Fieldset>
            </Fieldset>
          </Fieldset>
        </Fieldset>
      </Sanity>
    )
  }
)

.add(
  'Collapsible (demo)',
  () => {
    const level = number('start level', 0)
    const isCollapsible = boolean('isCollapsible', true)
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <div>
          <Fieldset isCollapsible={isCollapsible} legend="Noooo, pick me, pick me!" description={chance.sentence()} level={level}>
            <DefaultTextField label="Content" level={level + 1} />
            <DefaultTextField label="Content" level={level + 1} description="Test this one" />
            <DefaultTextField label="Content" level={level + 1} />
            <DefaultTextField label="Content" level={level + 1} />
          </Fieldset>
          <Fieldset legend="Fieldsets can be collapsed" description={chance.sentence()} level={level}>
            <Fieldset isCollapsible={isCollapsible} legend="Open me" description={chance.sentence()} level={level + 1}>
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
            <Fieldset isCollapsible={isCollapsible} legend="No, open me!" description={chance.sentence()} level={level + 1}>
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
            <Fieldset isCollapsible={isCollapsible} legend="Noooo, pick me, pick me!" description={chance.sentence()} level={level + 1}>
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
          </Fieldset>
        </div>
      </Sanity>
    )
  }
)

.add(
  'Columns (demo)',
  () => {
    const columns = number('columns', 3)
    const level = number('start level', 0)
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
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
      </Sanity>
    )
  }
)

.add(
  'Example',
  () => {
    return (
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
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
          <Fieldset isCollapsible legend="Collapsible Level 0" level={0}>
            <DefaultTextField label="Content" level={1} />
          </Fieldset>
          <Fieldset isCollapsible legend="Collapsible Level 0, 2 columns" level={0} columns={2}>
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

          <Fieldset legend="Level 0 with 2 columns. Collapsible" level={0} columns={2}>
            <Fieldset isCollapsible legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
            <Fieldset isCollapsible legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
            <Fieldset isCollapsible legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
            <Fieldset isCollapsible legend="Level 1" level={1}><DefaultTextField label="Content" level={2} /></Fieldset>
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
      </Sanity>
    )
  }
)
