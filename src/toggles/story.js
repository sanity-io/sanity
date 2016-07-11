import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import ToggleButtons from 'component:@sanity/components/toggles/buttons'
import Switch from 'component:@sanity/components/toggles/switch'
import Checkbox from 'component:@sanity/components/toggles/checkbox'

storiesOf('Toggles').addWithInfo(
  'Switch (off)',
  `
    Role: component:@sanity/components/toggles/switch
  `,
  () => {
    return (
      <Switch onChange={action('change')} label="Switch is off" />
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
      <Switch checked label="Switch is on" />
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
      <Switch label="This checkbox is disabled" disabled />
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
      <div>
        <Checkbox label="This is a checkbox" />
        <Checkbox label="This is a disabled checkbox" disabled />
        <Checkbox label="This is a checked checkbox" checked />
        <Checkbox label="This is a disabled checked checkbox" checked disabled />

      </div>
    )
  },
  {inline: true, propTables: [Checkbox]}
)

.addWithInfo(
  'Buttons',
  `
    Role: component:@sanity/components/toggles/buttons
  `,
  () => {
    const items = [
      {
        title: 'The good',
        default: true,
        action() {
          action('Clicked the good')
        },
        icon: false
      },
      {
        title: 'The Bad',
        default: true,
        action() {
          console.log('clicked the bad')
          action('Clicked')
        },
        icon: false
      },
      {
        title: 'The ugly',
        default: true,
        action() {
          action('Clicked the ugly')
        },
        icon: false
      }
    ]
    return (
      <div>
        <ToggleButtons items={items} label="Select something" />
      </div>
    )
  },
  {inline: true, propTables: [ToggleButtons]}
)
