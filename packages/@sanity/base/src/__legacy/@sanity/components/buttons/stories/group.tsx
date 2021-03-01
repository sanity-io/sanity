import Chance from 'chance'
import {range} from 'lodash'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ButtonGroup from 'part:@sanity/components/buttons/button-group'
import Button from 'part:@sanity/components/buttons/default'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {Container} from 'part:@sanity/storybook/components'
import React from 'react'

const chance = new Chance()

const items = [
  {index: '1', title: 'Test'},
  {index: '2', title: 'Test 2'},
  {index: '3', title: 'Test 3'},
  {index: '4', title: 'Test 4'},
  {index: '5', title: 'Test 5'},
  {index: '6', title: 'Test 6'},
  {index: '7', title: 'Test 7'},
  {index: '8', title: 'Test 8'},
  {index: '9', title: 'Test 9'},
  {index: '10', title: 'Test 10'},
  {index: '11', title: 'Test 11'},
]

export function GroupStory() {
  const qtyButtons = number('# buttons', 2, 'test')
  const loading = boolean('Loading', false, 'buttonProp')
  const onlyIcon = boolean('Only icon', false, 'test')
  const icon = boolean('icon', false, 'buttonProp') ? SanityLogoIcon : undefined
  const buttonText = text('Button text', '', 'buttonProp')
  const buttonColor = select('kind', ['default', 'simple', 'secondary'], 'default', 'props')
  const buttonKind = select(
    'color',
    [undefined, 'primary', 'success', 'danger', 'white'],
    undefined,
    'props'
  )

  return (
    <Container>
      <Sanity part="part:@sanity/components/buttons/button-group" propTables={[ButtonGroup]}>
        <ButtonGroup>
          {range(0, qtyButtons).map((i) => {
            return (
              <Button
                kind={buttonKind}
                color={buttonColor}
                key={i}
                loading={loading}
                icon={icon || (onlyIcon && SanityLogoIcon)}
              >
                {buttonText || (!onlyIcon && (i % 2 ? chance.word() : chance.name()))}
              </Button>
            )
          })}
          <DropDownButton
            items={items}
            kind={buttonKind}
            color={buttonColor}
            loading={loading}
            onAction={action('onAction')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            icon={icon || (onlyIcon && SanityLogoIcon)}
          >
            {!onlyIcon && 'Dropdown'}
          </DropDownButton>
        </ButtonGroup>
      </Sanity>
    </Container>
  )
}
