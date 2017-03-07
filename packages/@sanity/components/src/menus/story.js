import React from 'react'
import Menu from 'part:@sanity/components/menus/default'
//import StateMenu from 'part:@sanity/components/menus/state'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, object, boolean} from 'part:@sanity/storybook/addons/knobs'


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
    return (
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
          items={object('items', noIconItems)}
          opened={boolean('opened', true)}
        />
      </div>
    )
  },
  {
    propTables: [Menu],
    role: 'part:@sanity/components/menus/default'
  }
)
.add(
  'With icons',
  () => {
    return (
      <div
        style={{
          width: '300px',
          position: 'relative'
        }}
      >
        <Menu
          onAction={action('onAction')}
          onClose={action('onClose')}
          onClickOutside={action('onClickOutside')}
          items={object('items', itemsWithIcons)}
          opened={boolean('opened', true)}
        />
      </div>
    )
  },
  {
    propTables: [Menu],
    role: 'part:@sanity/components/menus/default'
  }
)
