import React from 'react'
import {List as DefaultList, Item as DefaultItem} from 'part:@sanity/components/lists/default'
import {range} from 'lodash'
import Chance from 'chance'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const chance = new Chance()

const containerStyle: React.CSSProperties = {
  width: '90%',
  height: '90%',
  boxShadow: '0 0 10px #999',
  overflow: 'hidden',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translateX(-50%) translateY(-50%)'
}

const defaultItems = range(100).map((item, i) => {
  return {
    key: `${i}`,
    title: chance.name()
  }
})

export function DefaultStory() {
  return (
    <Sanity part="part:@sanity/components/lists/default" propTables={[DefaultList]}>
      <div style={containerStyle}>
        <DefaultList>
          {defaultItems.map((item, index) => {
            return <DefaultItem key={String(index)}>{item.title}</DefaultItem>
          })}
        </DefaultList>
      </div>
    </Sanity>
  )
}
