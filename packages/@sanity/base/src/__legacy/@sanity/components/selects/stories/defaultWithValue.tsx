import React from 'react'
import {action} from 'part:@sanity/storybook'
import DefaultSelect from 'part:@sanity/components/selects/default'
import {range} from 'lodash'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

import Chance from 'chance'

const chance = new Chance()

const items = range(20).map((item, i) => {
  return {
    title: chance.name(),
    key: `${i}`,
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
  left: 0,
}

export function DefaultWithValueStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
        <DefaultSelect
          label={text('label', 'This is the label', 'props')}
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
          value={items[10]}
          items={items}
          disabled={boolean('disabled', false, 'props')}
        />
      </Sanity>
    </div>
  )
}
