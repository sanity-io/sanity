import React from 'react'
import Button from 'component:@sanity/components/buttons/default'
import Fab from 'component:@sanity/components/buttons/fab'
import DropDownButton from 'component:@sanity/components/buttons/dropdown'
import {storiesOf, action} from 'component:@sanity/storybook'
import FaBeer from 'react-icons/lib/fa/beer'

storiesOf('Buttons').addWithInfo(
  'Default Button ',
  `
    Standard button
    Role: component:@sanity/components/buttons/default
  `,
  () => (
    <div>
      <Button onClick={action('clicked')}>Default</Button>
      <Button onClick={action('clicked')} colored>colored</Button>
      <Button onClick={action('clicked')} inverted>Inverted</Button>
      <Button onClick={action('clicked')} kind="danger">Kind=danger</Button>
      <Button onClick={action('clicked')} kind="danger" inverted>Kind=danger inverted</Button>
      <Button onClick={action('clicked')} colored inverted>colored inverted</Button>
      <Button onClick={action('clicked')} icon={FaBeer}>
        With icon
      </Button>
      <Button onClick={action('clicked')} colored icon={FaBeer}>
        With icon
      </Button>
      <Button onClick={action('clicked')} kind="danger" icon={FaBeer} inverted>
        Danger, inverted & icon
      </Button>
    </div>
  ),
  {inline: true, propTables: [Button]}
)

.addWithInfo(
  'Fab (Floating Action Button)',
  `
    Borrowed from Googles material design. Used to create new stuff. Is by default fixed to bottom right.
  `,
  () => (
    <div>
      <Fab onClick={action('onClick')} fixed={false} colored />
    </div>
  ),
  {inline: true, propTables: [Fab]}
)

.addWithInfo(
  'DropDownButton',
  `
    Buttons that opens a menu.
  `,
  () => {
    const items = [
      {title: 'Test'},
      {title: 'Test 2'},
      {title: 'Test 3'}
    ]
    return (
      <div>
        <DropDownButton items={items}>This is a dropdown</DropDownButton>
      </div>
    )
  },
  {inline: true, propTables: [DropDownButton]}
)
