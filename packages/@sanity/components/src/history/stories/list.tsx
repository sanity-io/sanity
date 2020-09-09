import React from 'react'
import {number} from 'part:@sanity/storybook/addons/knobs'
import ListItem from 'part:@sanity/components/history/list-item'
import {range} from 'lodash'
import Chance from 'chance'

const chance = new Chance()

const mockUser = () => {
  return {
    identity: chance.guid(),
    displayName: chance.name(),
    email: chance.email(),
    imageUrl: `https://placeimg.com/64/64/any?${Math.random() * 1000}`
  }
}

const mockHistoryItem = () => {
  return {
    title: 'Test',
    status: 'published',
    key: chance.guid(),
    users: range(Math.floor(Math.random() * 4) + 1).map(() => mockUser())
  }
}

export function ListStory() {
  return (
    <div>
      <ListItem status="draft" title="test" users={[mockUser()]} />
      <ListItem
        status="published"
        title="23 may 2018"
        users={[mockUser()]}
        isSelected
        isCurrentVersion
      />
      <ListItem status="unpublished" title="22 may 2018" users={[mockUser()]} />
      {range(number('items', 10, 'test')).map(() => {
        const item = mockHistoryItem()
        return <ListItem {...item} key={item.key} />
      })}
      <ListItem status="created" title="test" users={[mockUser()]} />
    </div>
  )
}
