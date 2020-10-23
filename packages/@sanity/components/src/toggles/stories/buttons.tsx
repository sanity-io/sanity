import React from 'react'
import {action} from 'part:@sanity/storybook'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import {number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  padding: '2rem',
  boxSizing: 'border-box',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

export function ButtonsStory() {
  const items = [
    {
      title: 'The good',
      key: 'good',
    },
    {
      title: 'The Bad',
      key: 'bad',
    },
    {
      title: 'The ugly',
      key: 'ugly',
    },
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
}
