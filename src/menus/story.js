import React from 'react'
import Menu from 'component:@sanity/components/menus/default'
import {storiesOf, action} from 'component:@sanity/storybook'
import FaBeer from 'react-icons/lib/fa/beer'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

storiesOf('Menus')
.addDecorator(centered)
.addWithRole(
  'Menu',
  `
    Default menu
  `,
  'component:@sanity/components/menus/default',
  () => {
    return (
      <div style={{
        width: '300px',
        position: 'relative'}}>
        <Menu
          onAction={action('Clicked item')}
          items={[
            {
              title: 'First item',
              id: '1'
            },
            {
              title: 'Second item',
              id: '1'
            },
            {
              title: 'Third item',
              id: '3'
            },
            {
              kind: 'divider'
            },
            {
              title: 'Extra item',
              id: '4'
            }
          ]}
          opened
        />
      </div>
    )
  },
  {propTables: [Menu]}
)
.addWithRole(
  'Menu (with icons)',
  `
    ## Using icons
  `,
  'component:@sanity/components/menus/default',
  () => {
    const items = [
      {
        title: 'First item',
        icon: FaBeer
      },
      {
        title: 'Second item',
        icon: FaBeer
      },
      {
        title: 'Third item',
        icon: FaBeer
      },
      {
        kind: 'divider'
      },
      {
        title: 'Extra item',
        icon: FaBeer
      }
    ]
    return (
      <div style={{
        width: '300px',
        position: 'relative'}}>
        <Menu onAction={action('Clicked item')} items={items} opened />
      </div>
    )
  },
  {inline: true, propTables: [Menu]}
)
