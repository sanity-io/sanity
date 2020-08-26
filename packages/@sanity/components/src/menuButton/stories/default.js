import {MenuButton} from 'part:@sanity/components/menu-button'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  const open = boolean('Open', false, 'Props')
  const placement = select(
    'Placement',
    {
      'top-start': 'Top start',
      top: 'Top',
      'top-end': 'Top end',
      'right-start': 'Right start',
      right: 'Right',
      'right-end': 'Right end',
      'bottom-start': 'Bottom start',
      bottom: 'Bottom',
      'bottom-end': 'Bottom end',
      'left-start': 'Left start',
      left: 'Left',
      'left-end': 'Left end'
    },
    'bottom',
    'Props'
  )

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[MenuButton]}>
        <MenuButton
          menu={<div style={{padding: 20}}>This is the menu</div>}
          open={open}
          placement={placement}
          setOpen={action('setOpen')}
        >
          Open menu
        </MenuButton>
      </Sanity>
    </CenteredContainer>
  )
}
