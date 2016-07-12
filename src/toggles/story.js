import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import ToggleButtons from 'component:@sanity/components/toggles/buttons'
import Switch from 'component:@sanity/components/toggles/switch'
import Checkbox from 'component:@sanity/components/toggles/checkbox'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'

storiesOf('Toggles')
.addDecorator(centered)
.addWithRole(
  'Switch (off)',
  '',
  'component:@sanity/components/toggles/switch',
  () => {
    return (
      <Switch onChange={action('change')} label="Switch is off" />
    )
  },
  {propTables: [Switch]}
)
.addWithRole(
  'Switch (on)',
  '',
  'component:@sanity/components/toggles/switch',
  () => {
    return (
      <Switch checked label="Switch is on" onClick={linkTo('Switch (off)')} />
    )
  },
  {propTables: [Switch]}
)
.addWithRole(
  'Switch (disabled)',
  '',
  'component:@sanity/components/toggles/switch',
  () => {
    return (
      <Switch label="This checkbox is disabled" disabled />
    )
  },
  {propTables: [Switch]}
)

.addWithRole(
  'Checkbox',
  '',
  'component:@sanity/components/toggles/checkbox',
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
  {propTables: [Checkbox]}
)

.addWithRole(
  'Buttons',
  '',
  'component:@sanity/components/toggles/buttons',
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
      <ToggleButtons items={items} label="Select something" />
    )
  },
  {propTables: [ToggleButtons]}
)
