import React from 'react'
import Button from 'component:@sanity/components/buttons/default'
import Fab from 'component:@sanity/components/buttons/fab'
import DropDownButton from 'component:@sanity/components/buttons/dropdown'
import {storiesOf, action} from 'component:@sanity/storybook'

storiesOf('Buttons').addWithInfo(
  'Defaultbutton',
  `
    Standard button
    Role: component:@sanity/components/buttons/default
  `,
  () => (
    <div>
      <Button onClick={action('clicked')}>My First Button</Button>
    </div>
  ),
  {inline: true, propTables: [Button]}
)

storiesOf('Buttons').addWithInfo(
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

storiesOf('Buttons').addWithInfo(
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
