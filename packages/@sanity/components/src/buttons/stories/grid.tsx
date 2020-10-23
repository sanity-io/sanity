import Chance from 'chance'
import {range} from 'lodash'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import Button from 'part:@sanity/components/buttons/default'
import {text, select, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {Container} from 'part:@sanity/storybook/components'
import React from 'react'

const chance = new Chance()

export function GridStory() {
  const qtyButtons = number('# buttons', 2, 'test')
  const buttonText = text('Button text', '')

  return (
    <Container>
      <Sanity part="part:@sanity/components/buttons/button-grid" propTables={[ButtonGrid]}>
        <ButtonGrid
          align={select('align', ['start', 'end'], 'start', 'props')}
          secondary={range(0, number('# secondary', 1)).map((i) => {
            return (
              <Button inverted key={i}>
                {buttonText || (i % 2 ? chance.word() : chance.name())}
              </Button>
            )
          })}
        >
          {range(0, qtyButtons).map((i) => {
            return <Button key={i}>{buttonText || (i % 2 ? chance.word() : chance.name())}</Button>
          })}
        </ButtonGrid>

        <h2>Button grid with 1 (primary) button</h2>
        <ButtonGrid align={select('align', ['start', 'end'], 'start', 'props')}>
          <Button>Test</Button>
        </ButtonGrid>

        <h2>Button grid with 1 (secondary) button</h2>
        <ButtonGrid
          align={select('align', ['start', 'end'], 'start', 'props')}
          secondary={<Button>Test</Button>}
        />
      </Sanity>
    </Container>
  )
}
