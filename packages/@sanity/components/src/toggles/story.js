import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import ToggleButton from 'part:@sanity/components/toggles/button'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, boolean, text, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'block',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
}
storiesOf('Toggles')
  .addDecorator(withKnobs)
  .add('Switch', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/toggles/switch" propTables={[Switch]}>
          <Switch
            checked={boolean('undefined', false) ? undefined : boolean('checked', false, 'props')}
            label={text('label', 'This is the label', 'props')}
            description={text('description', 'This is the description', 'props')}
            disabled={boolean('disabled', false, 'props')}
            onChange={action('change')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
          />
        </Sanity>
      </div>
    )
  })
  .add('Checkbox', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/toggles/checkbox" propTables={[Checkbox]}>
          <Checkbox
            label={text('label', 'This is the label', 'props')}
            checked={boolean('undefined', false) ? undefined : boolean('checked', false, 'props')}
            disabled={boolean('disabled', false, 'props')}
            onChange={action('onChange')}
            onBlur={action('onBlur')}
            onFocus={action('onFocus')}
          >
            {boolean('Children', false, 'test') ? <h1 style={{color: 'red'}}>Test</h1> : false}
          </Checkbox>
        </Sanity>
      </div>
    )
  })
  .add('Buttons', () => {
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
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/toggles/buttons" propTables={[ToggleButtons]}>
          <ToggleButtons
            items={items}
            label="Select something"
            onChange={action('onChange')}
            value={items[number('value', 0, {range: 'true', min: 0, max: 2}, 'test')]}
          />
        </Sanity>
      </div>
    )
  })
  .add('Toggle button', () => {
    const icon = boolean('icon', false) ? SanityLogoIcon : false
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/toggles/buttons" propTables={[ToggleButtons]}>
          <ToggleButton
            selected={boolean('selected', false, 'props')}
            disabled={boolean('disabled', false, 'props')}
            onClick={action('onClick')}
            icon={icon}
          >
            {text('children', 'this is the content', 'props')}
          </ToggleButton>
        </Sanity>
      </div>
    )
  })
  .add('Toggle button collection', () => {
    return (
      <div style={centerStyle}>
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
        <ToggleButton icon={SanityLogoIcon} selected onClick={action('onClick')} />
      </div>
    )
  })
