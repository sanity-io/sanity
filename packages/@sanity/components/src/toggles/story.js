import React from 'react'
import {storiesOf, action, linkTo} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import ToggleButton from 'part:@sanity/components/toggles/button'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, boolean, text, select} from 'part:@sanity/storybook/addons/knobs'

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
.addDecorator(withKnobs)
.add(
  'Switch',
  () => {
    return (
      <Switch
        checked={boolean('checked', false)}
        label={text('label', 'This is the label')}
        disabled={boolean('disabled', false)}
        onChange={action('change')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
      />
    )
  },
  {propTables: [Switch], role: 'part:@sanity/components/toggles/switch'}
)
.add(
  'Checkbox',
  () => {
    return (
      <Checkbox
        label={text('label', 'This is the label')}
        checked={boolean('checked', false)}
        disabled={boolean('disabled', false)}
        onChange={action('onChange')}
        onBlur={action('onBlur')}
        onFocus={action('onFocus')}
      />
    )
  },
  {propTables: [Checkbox], role: 'part:@sanity/components/toggles/checkbox'}
)
.add(
  'Buttons',
  () => {
    const items = [
      {
        title: 'The good',
        key: 'good'
      },
      {
        title: 'The Bad',
        key: 'bad'
      },
      {
        title: 'The ugly',
        key: 'ugly'
      }
    ]
    return (
      <ToggleButtons items={items} label="Select something" onChange={action('onChange')} value={items[1]} />
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)
.add(
  'Toggle button',
  () => {
    const icon = boolean('icon', false) ? SanityLogoIcon : false
    return (
      <ToggleButton
        selected={boolean('selected', false)}
        onClick={action('onClick')}
        icon={icon}
      >
        {text('content', 'this is the content')}
      </ToggleButton>
    )
  },
  {propTables: [ToggleButtons], role: 'part:@sanity/components/toggles/buttons'}
)
.add(
  'Toggle button collection',
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
