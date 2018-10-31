import React, {Fragment} from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, number, boolean} from 'part:@sanity/storybook/addons/knobs'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Chance from 'chance'

const chance = new Chance()

const wrapperStyles = {
  margin: '1rem'
}

storiesOf('Fieldsets')
  .addDecorator(withKnobs)
  .add(
    'Default',
    // `
    //   The default fieldset is used to gather a collection of fields.
    // `,
    () => {
      return (
        <div style={wrapperStyles}>
          <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
            <Fieldset
              legend={text('legend', 'This is the legend', 'props')}
              description={text('description', 'This is the description', 'props')}
              level={number('level', 1, 'props')}
              transparent={boolean('transparent', false, 'props')}
              tabIndex={boolean('tabIndex', false, 'test') ? 0 : false}
              markers={boolean('show markers', false, 'test') ? [] : undefined}
            >
              {text('children', 'Put content here', 'props')}
            </Fieldset>
          </Sanity>
        </div>
      )
    }
  )
  .add('Nested (demo)', () => {
    return (
      <div style={wrapperStyles}>
        <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
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
        </Sanity>
      </div>
    )
  })

  .add(
    'Crazy nested (demo)',
    // `
    //   Fieldsets supports beeing inside itselfs, and get new styling!
    // `,
    () => {
      return (
        <div style={wrapperStyles}>
          <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
            <Fieldset
              legend="Dude, I heard you like fieldsets…"
              description={chance.paragraph()}
              level={1}
              tabIndex="0"
            >
              <Fieldset
                legend="So I put a fieldset in a fieldset…"
                description={chance.paragraph()}
                level={2}
                tabIndex="0"
              >
                <Fieldset
                  legend="In a fieldset…"
                  description={chance.paragraph()}
                  level={3}
                  tabIndex="0"
                >
                  <Fieldset
                    legend="In a fieldset!"
                    description={chance.paragraph()}
                    level={4}
                    tabIndex="0"
                  >
                    <Fieldset
                      legend="In a fieldset!"
                      description={chance.paragraph()}
                      level={5}
                      tabIndex="0"
                    >
                      Content
                    </Fieldset>
                  </Fieldset>
                </Fieldset>
              </Fieldset>
            </Fieldset>
          </Sanity>
        </div>
      )
    }
  )

  .add('Collapsible (demo)', () => {
    const level = number('start level', 1)
    const isCollapsible = boolean('isCollapsible', true)
    return (
      <div style={wrapperStyles}>
        <Sanity part="part:@sanity/components/fieldsets/default" propTables={[Fieldset]}>
          <Fragment>
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
          </Fragment>
        </Sanity>
      </div>
    )
  })

  .add('Columns (demo)', () => {
    const columns = number('columns', 3)
    const level = number('start level', 1)
    return (
      <div style={wrapperStyles}>
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
      </div>
    )
  })
  .add('Spacing test', () => {
    return (
      <div style={wrapperStyles}>
        <Fieldset legend="Test" description={chance.paragraph()}>
          <DefaultTextField label="Label" placeholder="Placeholder" />
          <DefaultTextField label="Label" placeholder="Placeholder" />
        </Fieldset>
        <Fieldset legend="Test 2" description={chance.paragraph()}>
          <DefaultTextField label="Label" placeholder="Placeholder" />
        </Fieldset>
        <Fieldset legend="Test 3" description={chance.paragraph()} />
      </div>
    )
  })
