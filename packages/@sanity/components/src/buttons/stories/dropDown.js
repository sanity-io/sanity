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
  {index: '11', title: 'Test 11'}
]

const actionsProps = {
  onAction: action('onAction'),
  onBlur: action('onBlur'),
  onClick: action('onClick'),
  onFocus: action('onFocus')
}

export function DropDownStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/dropdown" propTables={[DropDownButton]}>
        <DropDownButton
          {...actionsProps}
          items={object('items', items, 'props')}
          color={select(
            'color',
            [undefined, 'primary', 'success', 'danger', 'white'],
            undefined,
            'props'
          )}
          kind={select('kind', ['default', 'simple', 'secondary'], 'default', 'props')}
          disabled={boolean('disabled', false, 'props')}
          inverted={boolean('inverted', false, 'props')}
          showArrow={boolean('showArrow', true, 'props')}
          loading={boolean('loading', false, 'props')}
          icon={boolean('icon', false, 'props') ? SanityLogoIcon : undefined}
        >
          {text('prop: children', 'This is a dropdown')}
        </DropDownButton>
      </Sanity>
    </CenteredContainer>
  )
}
