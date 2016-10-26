import React from 'react'
import {storiesOf, action, linkTo} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import ToggleButton from 'part:@sanity/components/toggles/button'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const centered = function (storyFn) {
  return <div style={style}>{storyFn()}</div>
}

storiesOf('Toggles')
.addDecorator(centered)
.addWithInfo(
  'Switch (off)',
  '',
  () => {
    return (
      <Switch onChange={action('change')} label="Switch is off" />
    )
  },
  {propTables: [Switch], role: 'part:@sanity/components/toggles/switch'}
)
.addWithInfo(
  'Switch (on)',
  '',
  () => {
    return (
      <Switch checked label="Switch is on" onChange={linkTo('Switch (off)')} />
    )
  },
  {propTables: [Switch], role: 'part:@sanity/components/toggles/switch'}
)
.addWithInfo(
  'Switch (disabled)',
  '',
  () => {
    return (
      <Switch label="This checkbox is disabled" disabled />
    )
  },
  {propTables: [Switch], role: 'part:@sanity/components/toggles/switch'}
)

.addWithInfo(
  'Checkbox',
  '',
  () => {
    return (
      <div>
        <Checkbox label="This is a checkbox" onChange={action('onChange')} />
        <Checkbox label="This is a disabled checkbox" disabled />
        <Checkbox label="This is a checked checkbox" checked onChange={action('onChange')} />
        <Checkbox label="This is a disabled checked checkbox" checked disabled />
      </div>
    )
  },
  {propTables: [Checkbox], role: 'part:@sanity/components/toggles/checkbox'}
)

.addWithInfo(
  'Buttons',
  '',
  () => {
    const items = [
      {
        title: 'The good',
        default: true,
        action() {
          action('Clicked the good')
        }
      },
      {
        title: 'The Bad',
        default: true,
        action() {
          action('Clicked')
        }
      },
      {
        title: 'The ugly',
        default: true,
        action() {
          action('Clicked the ugly')
        }
      }
    ]
    return (
      <ToggleButtons items={items} label="Select something" />
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)

.addWithInfo(
  'Toggle button',
  '',
  () => {
    return (
      <ToggleButton onClick={action('onClick')}>Toggle button</ToggleButton>
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)

.addWithInfo(
  'Toggle button (selected)',
  '',
  () => {
    return (
      <ToggleButton selected onClick={action('onClick')}>Toggle selected</ToggleButton>
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)

.addWithInfo(
  'Toggle button with icon',
  '',
  () => {
    return (
      <ToggleButton icon={SanityLogoIcon} onClick={action('onClick')} />
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)

.addWithInfo(
  'Toggle button with icon (selected)',
  '',
  () => {
    return (
      <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)

.addWithInfo(
  'Toggle button collection',
  '',
  () => {
    return (
      <div>
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
      </div>

    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)
