import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import Fab from 'part:@sanity/components/buttons/fab'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

storiesOf('Buttons')
  .addWithInfo(
    'Default Button',
    'Standard button Role: part:@sanity/components/buttons/default',
    () => (
      <Button onClick={action('clicked')}>Touch me!</Button>
    ),
    {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )
.addWithInfo(
'Variations',
'',
() => (
  <div>
    <Button onClick={action('clicked')}>Default</Button>
    <Button onClick={action('clicked')} colored>colored</Button>
    <Button onClick={action('clicked')} inverted>Inverted</Button>
    <Button onClick={action('clicked')} kind="danger">Kind=danger</Button>
    <Button onClick={action('clicked')} kind="danger" inverted>Kind=danger inverted</Button>
    <Button onClick={action('clicked')} colored inverted>colored inverted</Button>
    <Button onClick={action('clicked')} kind="secondary" icon={SanityLogoIcon} inverted>
      Secondary
    </Button>
    <Button onClick={action('clicked')} icon={SanityLogoIcon}>
      With icon
    </Button>
    <Button onClick={action('clicked')} colored icon={SanityLogoIcon}>
      Colored with icon
    </Button>
    <Button onClick={action('clicked')} kind="danger" icon={SanityLogoIcon} inverted>
      Danger, inverted & icon
    </Button>
  </div>
),
{propTables: [Button], role: 'part:@sanity/components/buttons/default'}
)

.addWithInfo(
  'Fab (Floating Action Button)',
  'Borrowed from Googles material design. Used to create new stuff. Is by default fixed to bottom right.',
  () => {
    return (
      <div>
        <Fab onClick={action('onClick')} fixed={false} colored />
      </div>
    )
  },
  {propTables: [Fab], role: 'part:@sanity/components/buttons/fab'}
)

.addWithInfo(
  'DropDownButton',
  'Buttons that opens a menu.',
  () => {
    const items = [
      {index: '1', title: 'Test'},
      {index: '2', title: 'Test 2'},
      {index: '3', title: 'Test 3'}
    ]
    return (
      <DropDownButton items={items} onAction={action('Clicked item')}>
        This is a dropdown
      </DropDownButton>
    )
  },
  {propTables: [DropDownButton], role: 'part:@sanity/components/buttons/dropdown'}
)
