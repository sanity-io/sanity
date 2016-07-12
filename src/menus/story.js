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
    const items = [
      {
        title: 'First item',
        action: () => action('Clicked first item')
      },
      {
        title: 'Second item',
        action: () => action('Clicked second item')
      },
      {
        title: 'Third item',
        action: () => action('Clicked third item')
      },
      {
        kind: 'divider'
      },
      {
        title: 'Extra item',
        action: () => action('Clicked third item')
      }
    ]
    return (
      <div style={{
        width: '300px',
        position: 'relative'}}>
        <Menu items={items} opened />
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
        icon: FaBeer,
        action: () => action('Clicked first item')
      },
      {
        title: 'Second item',
        icon: FaBeer,
        action: () => action('Clicked second item')
      },
      {
        title: 'Third item',
        icon: FaBeer,
        action: () => action('Clicked third item')
      },
      {
        kind: 'divider'
      },
      {
        title: 'Extra item',
        icon: FaBeer,
        action: () => action('Clicked third item')
      }
    ]
    return (
      <div style={{
        width: '300px',
        position: 'relative'}}>
        <Menu items={items} opened />
      </div>
    )
  },
  {inline: true, propTables: [Menu]}
)
