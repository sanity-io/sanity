import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Button from 'part:@sanity/components/buttons/default'
import {withKnobs, text, select, number, boolean} from 'part:@sanity/storybook/addons/knobs'
import ListItem from './ListItem'
import {range} from 'lodash'
import Chance from 'chance'

const chance = new Chance()

const mockUser = () => {
  return {
    identity: chance.guid(),
    displayName: chance.name(),
    email: chance.email(),
    imageUrl: `https://placeimg.com/64/64/any?${Math.random()*1000}`
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

storiesOf('History')
  .addDecorator(withKnobs)
  .add('List', () => {
    return (
      <div>
        <ListItem status="draft" title="test" users={[mockUser()]} />
        <ListItem status="published" title="23 may 2018" users={[mockUser()]} isSelected />
        <ListItem status="unpublished" title="22 may 2018" users={[mockUser()]} />
        {range(number('items', 10, 'test')).map(() => {
          const item = mockHistoryItem()
          return <ListItem key={item.key} {...item} />
        })}
        <ListItem status="created" title="test" users={[mockUser()]} />
      </div>
    )
  })

  .add('List item', () => {
    const users = range(number('users', 1, 'test')).map(() => mockUser)
    return (
      <ListItem
        status={select('status', ['published', 'edited', 'created'], 'edited')}
        title={text('title', 'Steve Wozniak')}
        users={users}
        isSelected={boolean('isSelected', false, 'props')}
      >
        {boolean('children', false, 'test') && (
          <div>
            <Button inverted color="white" padding="small">Publish</Button>
            <Button kind="simple" padding="small">Discard</Button>
          </div>
        )}
      </ListItem>
    )
  })
