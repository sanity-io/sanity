import Chance from 'chance'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import {number, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {Container} from 'part:@sanity/storybook/components'
import React from 'react'

const chance = new Chance()

export function CollapsibleStory() {
  const level = number('start level', 1)
  const isCollapsible = boolean('isCollapsible', true)

  return (
    <Container>
      <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
        <div style={{margin: '0 auto', maxWidth: 640}}>
          <Fieldset
            isCollapsible={isCollapsible}
            legend="Noooo, pick me, pick me!"
            description={chance.sentence()}
            level={level}
          >
            <DefaultTextField label="Content" level={level + 1} />
            <DefaultTextField label="Content" level={level + 1} description="Test this one" />
            <DefaultTextField label="Content" level={level + 1} />
            <DefaultTextField label="Content" level={level + 1} />
          </Fieldset>
          <Fieldset
            legend="Fieldsets can be collapsed"
            description={chance.sentence()}
            level={level}
          >
            <Fieldset
              isCollapsible={isCollapsible}
              legend="Open me"
              description={chance.sentence()}
              level={level + 1}
            >
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
            <Fieldset
              isCollapsible={isCollapsible}
              legend="No, open me!"
              description={chance.sentence()}
              level={level + 1}
            >
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
            <Fieldset
              isCollapsible={isCollapsible}
              legend="Noooo, pick me, pick me!"
              description={chance.sentence()}
              level={level + 1}
            >
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} description="Test this one" />
              <DefaultTextField label="Content" level={level + 2} />
              <DefaultTextField label="Content" level={level + 2} />
            </Fieldset>
          </Fieldset>
        </div>
      </Sanity>
    </Container>
  )
}
