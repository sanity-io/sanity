import React from 'react'
import {action} from 'part:@sanity/storybook'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {range} from 'lodash'
import {boolean, text, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

import Chance from 'chance'

const chance = new Chance()

const items = range(20).map((item, i) => {
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

// When provided with items, the component searches inside these when no onInputChange is provided
export function SearchableStory() {
  const renderItem = function(item) {
    return <div>{item.title}</div>
  }
  const hasOnclear = boolean('has onClear', false, 'test')
  const selected = number('Selected item (value)', -1, {
    range: true,
    min: -1,
    max: items.length,
    step: 1
  })

  const hasItems = boolean('hasItems', false, 'test') || undefined

  const selectedItem = (items && items[selected]) || undefined
  return (
    <div style={{minWidth: '320px', ...centerStyle}}>
      <Sanity part="part:@sanity/components/selects/searchable" propTables={[SearchableSelect]}>
        <SearchableSelect
          label={text('label', 'This is the label', 'props')}
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
          onOpen={action('onOpen')}
          value={hasItems && selectedItem}
          inputValue={text('Inputvalue', selectedItem && selectedItem.title, 'props')}
          renderItem={renderItem}
          items={hasItems && items}
          isLoading={boolean('isLoading', false, 'props')}
          disabled={boolean('disabled (prop)', false, 'props')}
          onClear={hasOnclear ? action('onClear') : undefined}
        />
      </Sanity>
    </div>
  )
}
