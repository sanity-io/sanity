import React from 'react'
import Menu from 'part:@sanity/components/menus/default'
//import StateMenu from 'part:@sanity/components/menus/state'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, object, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const noIconItems = [
  {
    title: 'First item',
    key: '1'
  },
  {
    title: 'Second item',
    key: '1'
  },
  {
    title: 'Third item',
    key: '3'
  },
  {
    title: 'Extra item',
    key: '4',
    divider: true
  }
]

const itemsWithIcons = [
  {
    title: 'First item',
    icon: SanityIcon,
    key: '1'
  },
  {
    title: 'Second item',
    icon: SanityIcon,
    key: '2'
  },
  {
    title: 'Third item',
    icon: SanityIcon,
    key: '3'
  },
  {
    kind: 'divider'
  },
  {
    title: 'Extra item',
    key: '4',
    icon: SanityIcon
  }
]

storiesOf('Menus')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {

    const items = boolean('icons', false) ? itemsWithIcons : noIconItems

    return (
      <Sanity part="part:@sanity/components/menus/default" propTables={[Menu]}>
        <div
          style={{
            width: '300px',
            position: 'relative'
          }}
        >
          <Menu
            onAction={action('onAction')}
            onClose={action('onClose')}
            onClickOutside={action('Clicked outside')}
            items={object('items', items)}
            opened={boolean('opened', true)}
          />
        </div>
      </Sanity>
    )
  }
)
