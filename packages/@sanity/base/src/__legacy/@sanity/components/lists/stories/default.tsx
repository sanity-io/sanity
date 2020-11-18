import React from 'react'
import {List, Item} from 'part:@sanity/components/lists/default'
import {range} from 'lodash'
import Chance from 'chance'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const chance = new Chance()

const defaultItems = range(100).map((_, i) => {
  return {
    key: `${i}`,
    title: chance.name(),
  }
})

export function DefaultStory() {
  return (
    <Sanity part="part:@sanity/components/lists/default" propTables={[List]}>
      <List>
        {defaultItems.map((item) => (
          <Item key={item.key}>{item.title}</Item>
        ))}
      </List>
    </Sanity>
  )
}
