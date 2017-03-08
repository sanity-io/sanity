import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import ToggleButton from 'part:@sanity/components/toggles/button'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Toggles')
.addDecorator(withKnobs)
.add(
  'Switch',
  () => {
    return (
      <Sanity part="part:@sanity/components/toggles/switch" propTables={[Switch]}>
        <Switch
          checked={boolean('checked', false)}
          label={text('label', 'This is the label')}
          disabled={boolean('disabled', false)}
          onChange={action('change')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
        />
      </Sanity>
    )
  }
)
.add(
  'Checkbox',
  () => {
    return (
      <Sanity part="part:@sanity/components/toggles/checkbox" propTables={[Checkbox]}>
        <Checkbox
          label={text('label', 'This is the label')}
          checked={boolean('checked', false)}
          disabled={boolean('disabled', false)}
          onChange={action('onChange')}
          onBlur={action('onBlur')}
          onFocus={action('onFocus')}
        />
      </Sanity>
    )
  }
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
      <Sanity part="part:@sanity/components/toggles/buttons" propTables={[ToggleButtons]}>
        <ToggleButtons items={items} label="Select something" onChange={action('onChange')} value={items[1]} />
      </Sanity>
    )
  }
)
.add(
  'Toggle button',
  () => {
    const icon = boolean('icon', false) ? SanityLogoIcon : false
    return (
      <Sanity part="part:@sanity/components/toggles/buttons" propTables={[ToggleButtons]}>
        <ToggleButton
          selected={boolean('selected', false)}
          onClick={action('onClick')}
          icon={icon}
        >
          {text('content', 'this is the content')}
        </ToggleButton>
      </Sanity>
    )
  }
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
  }
)
