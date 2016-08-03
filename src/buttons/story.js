import React from 'react'
import Button from 'component:@sanity/components/buttons/default'
import Fab from 'component:@sanity/components/buttons/fab'
import DropDownButton from 'component:@sanity/components/buttons/dropdown'
import {storiesOf, action} from 'component:@sanity/storybook'
import FaBeer from 'react-icons/lib/fa/beer'

import centered from '../storybook-addons/centered.js'
require('../storybook-addons/role.js')

storiesOf('Buttons')
  .addDecorator(centered)
  .addWithRole(
    'Default Button',
    'Standard button Role: component:@sanity/components/buttons/default',
    'component:@sanity/components/buttons/default',
    () => (
      <Button onClick={action('clicked')}>Touch me!</Button>
    ),
    {propTables: [Button], role: 'rolename'}
  )
.addWithRole(
'Variations',
'',
'component:@sanity/components/buttons/default',
() => (
  <div>
    <Button onClick={action('clicked')}>Default</Button>
    <Button onClick={action('clicked')} colored>colored</Button>
    <Button onClick={action('clicked')} inverted>Inverted</Button>
    <Button onClick={action('clicked')} kind="danger">Kind=danger</Button>
    <Button onClick={action('clicked')} kind="danger" inverted>Kind=danger inverted</Button>
    <Button onClick={action('clicked')} colored inverted>colored inverted</Button>
    <Button onClick={action('clicked')} kind="secondary" icon={FaBeer} inverted>
      Secondary
    </Button>
    <Button onClick={action('clicked')} icon={FaBeer}>
      With icon
    </Button>
    <Button onClick={action('clicked')} colored icon={FaBeer}>
      Colored with icon
    </Button>
    <Button onClick={action('clicked')} kind="danger" icon={FaBeer} inverted>
      Danger, inverted & icon
    </Button>
  </div>
),
{propTables: [Button], role: 'rolename'}
)

.addWithRole(
  'Fab (Floating Action Button)',
  'Borrowed from Googles material design. Used to create new stuff. Is by default fixed to bottom right.',
  'component:@sanity/components/buttons/fab',
  () => {
    return (
      <div>
        <Fab onClick={action('onClick')} fixed={false} colored />
      </div>
    )
  },
  {propTables: [Fab]}
)

.addWithRole(
  'DropDownButton',
  'Buttons that opens a menu.',
  'component:@sanity/components/buttons/dropdown',
  () => {
    const items = [
      {index: '1', title: 'Test'},
      {index: '2', title: 'Test 2'},
      {index: '3', title: 'Test 3'}
    ]
    return (
      <div>
        <DropDownButton items={items} onAction={action('Clicked item')}>
          This is a dropdown
        </DropDownButton>
      </div>
    )
  },
  {propTables: [DropDownButton]}
)
