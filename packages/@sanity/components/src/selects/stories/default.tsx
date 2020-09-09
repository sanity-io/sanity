import React from 'react'
import {action} from 'part:@sanity/storybook'
import DefaultSelect from 'part:@sanity/components/selects/default'
import {range} from 'lodash'
import {boolean, text, number, color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

import Chance from 'chance'

const chance = new Chance()

const items = range(20).map((_, i) => {
  return {
    title: chance.name(),
    key: `${i}`
  }
})

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

export function DefaultStory() {
  const options = {
    range: true,
    min: 0,
    max: items.length,
    step: 1
  }
  const valueIndex = number('Selected item', -1, options)
  return (
    <div
      style={{
        ...centerStyle,
        color: color('color', undefined, 'test'),
        backgroundColor: color('background color', undefined, 'test')
      }}
    >
      <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
        <DefaultSelect
          label={text('label', 'This is the label', 'props')}
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
          items={items}
          value={items[valueIndex]}
          disabled={boolean('disabled', false, 'props')}
        />
      </Sanity>
    </div>
  )
}
