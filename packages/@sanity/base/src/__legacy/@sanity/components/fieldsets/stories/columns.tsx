import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Chance from 'chance'
import {Container} from 'part:@sanity/storybook/components'

const chance = new Chance()

function DummyField({level}) {
  return (
    <DefaultFormField label="Label" description="Description" level={level} inline={false}>
      <DefaultTextInput value="" />
    </DefaultFormField>
  )
}

export function ColumnsStory() {
  const columns = number('columns', 3)
  const level = number('start level', 1)

  return (
    <Container>
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <div style={{margin: '0 auto', maxWidth: 640}}>
          <Fieldset
            legend={`${columns}columns`}
            columns={columns}
            description={chance.paragraph()}
            level={level}
          >
            <DummyField level={level + 1} />
            <DummyField level={level + 1} />
            <DummyField level={level + 1} />
            <DummyField level={level + 1} />
            <DummyField level={level + 1} />
            <DummyField level={level + 1} />
          </Fieldset>
        </div>
      </Sanity>
    </Container>
  )
}
