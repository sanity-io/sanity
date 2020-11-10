import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

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

const actionsProps = {
  onAction: action('onAction'),
  onBlur: action('onBlur'),
  onClick: action('onClick'),
  onFocus: action('onFocus'),
}

export function DropDownStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/dropdown" propTables={[DropDownButton]}>
        <DropDownButton
          {...actionsProps}
          items={object('Items', items, 'props')}
          color={select(
            'Color',
            [undefined, 'primary', 'success', 'danger', 'white'],
            undefined,
            'props'
          )}
          kind={select('Kind', ['default', 'simple', 'secondary'], 'default', 'props')}
          disabled={boolean('Disabled', false, 'props')}
          inverted={boolean('Inverted', false, 'props')}
          showArrow={boolean('Show arrow', true, 'props')}
          loading={boolean('Loading', false, 'props')}
          icon={boolean('Icon', false, 'props') ? SanityLogoIcon : undefined}
        >
          {text('Children', 'This is a dropdown', 'props')}
        </DropDownButton>
      </Sanity>
    </CenteredContainer>
  )
}
