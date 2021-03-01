import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Chance from 'chance'
import {Container} from 'part:@sanity/storybook/components'

const chance = new Chance()

export function NestedStory() {
  return (
    <Container>
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <div style={{margin: '0 auto', maxWidth: 640}}>
          <Fieldset
            legend="This is the legend"
            description="Fieldsets supports beeing inside itselfs, and get new styling!"
            level={1}
          >
            <Fieldset
              legend="This is the legend in a nested fieldset"
              description={chance.paragraph()}
              level={2}
            >
              A nested fieldset
            </Fieldset>
          </Fieldset>
        </div>
      </Sanity>
    </Container>
  )
}
