import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Switch from 'component:@sanity/components/toggles/switch'
import Checkbox from 'component:@sanity/components/toggles/checkbox'

storiesOf('Toggles').addWithInfo(
  'Switch (off)',
  `
    Role: component:@sanity/components/toggles/switch
  `,
  () => {
    return (
      <Switch onChange={function () {
        action('change')
        linkTo('Toggles', 'Switch (on)')
      }} label="Switch is off" />
    )
  },
  {inline: true, propTables: [Switch]}
)
.addWithInfo(
  'Switch (on)',
  `
    Role: component:@sanity/components/toggles/switch
  `,
  () => {
    return (
      <div>
      <Switch checked label="Switch is on"/>
      </div>
    )
  },
  {inline: true, propTables: [Switch]}
)
.addWithInfo(
  'Switch (disabled)',
  `
    Role: component:@sanity/components/toggles/switch
  `,
  () => {
    return (
      <Switch disabled/>
    )
  },
  {inline: true, propTables: [Switch]}
)

.addWithInfo(
  'Checkbox',
  `
    Role: component:@sanity/components/toggles/checkbox
  `,
  () => {
    return (
      <Checkbox label="This is a checkbox" />
    )
  },
  {inline: true, propTables: [Switch]}
)
