import React from 'react'
import {action} from 'part:@sanity/storybook'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import {boolean, text, number} from 'part:@sanity/storybook/addons/knobs'
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

export function CheckboxStory() {
  const fontSize = number('fontSize', 1, {range: true, min: 0.5, max: 3, step: 0.1}, 'test')
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/toggles/checkbox" propTables={[Checkbox]}>
        <div
          style={{
            fontSize: `${fontSize}em`,
          }}
        >
          <Checkbox
            label={text('label', `This is the label (${fontSize}em)`, 'props')}
            checked={boolean('undefined', false) ? undefined : boolean('checked', false, 'props')}
            disabled={boolean('disabled', false, 'props')}
            onChange={action('onChange')}
            onBlur={action('onBlur')}
            onFocus={action('onFocus')}
            ref={{current: true} as any}
          >
            {boolean('Children', false, 'test') ? <h1 style={{color: 'red'}}>Test</h1> : false}
          </Checkbox>
        </div>
      </Sanity>
    </div>
  )
}
