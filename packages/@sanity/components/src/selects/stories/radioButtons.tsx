import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook'
import RadioSelect from 'part:@sanity/components/selects/radio'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const chance = new Chance()

const radioItems = range(10).map((item, i) => {
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

// When an onInputChange is provided. Populate the items, and remember to set _loading prop_ when
// waiting for server.
export function RadioButtonsStory() {
  const value =
    radioItems[number('value', 0, {range: true, min: 0, max: radioItems.length - 1}, 'props')]

  return (
    <div style={{...centerStyle, padding: '2rem'}}>
      <Sanity part="part:@sanity/components/selects/radio" propTables={[RadioSelect]}>
        <RadioSelect
          items={radioItems}
          value={value}
          onChange={action('onChange')}
          direction={select('direction', [false, 'vertical', 'vertical'], undefined, 'props')}
        />
      </Sanity>
    </div>
  )
}
