import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Chance from 'chance'
import {Container} from 'part:@sanity/storybook/components'

const chance = new Chance()

export function DeeplyNestedStory() {
  return (
    <Container>
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <div style={{margin: '0 auto', maxWidth: 640}}>
          <Fieldset
            legend="Dude, I heard you like fieldsets…"
            description={chance.paragraph()}
            level={1}
            tabIndex={0}
          >
            <Fieldset
              legend="So I put a fieldset in a fieldset…"
              description={chance.paragraph()}
              level={2}
              tabIndex={0}
            >
              <Fieldset
                legend="In a fieldset…"
                description={chance.paragraph()}
                level={3}
                tabIndex={0}
              >
                <Fieldset
                  legend="In a fieldset!"
                  description={chance.paragraph()}
                  level={4}
                  tabIndex={0}
                >
                  <Fieldset
                    legend="In a fieldset!"
                    description={chance.paragraph()}
                    level={5}
                    tabIndex={0}
                  >
                    Content
                  </Fieldset>
                </Fieldset>
              </Fieldset>
            </Fieldset>
          </Fieldset>
        </div>
      </Sanity>
    </Container>
  )
}
