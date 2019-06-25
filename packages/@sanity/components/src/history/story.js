import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Button from 'part:@sanity/components/buttons/default'
import {withKnobs, text, select, number, boolean} from 'part:@sanity/storybook/addons/knobs'
import ListItem from 'part:@sanity/components/history/list-item'
import {range} from 'lodash'
import Chance from 'chance'
import Sanity from 'part:@sanity/storybook/addons/sanity'

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

storiesOf('History')
  .addDecorator(withKnobs)
  .add('List', () => {
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
          return <ListItem key={item.key} {...item} />
        })}
        <ListItem status="created" title="test" users={[mockUser()]} />
      </div>
    )
  })

  .add('List item', () => {
    const users = range(number('users', 1, 'test')).map(() => mockUser())
    return (
      <Sanity part="part:@sanity/components/history/list-item" propTables={[ListItem]}>
        <ListItem
          status={select(
            'status',
            ['published', 'unpublished', 'edited', 'created', 'truncated'],
            'edited'
          )}
          title={text('title', '23 may 2019')}
          users={users}
          isCurrentVersion={boolean('isCurrentVersion', false, 'props')}
          isSelected={boolean('isSelected', false, 'props')}
        >
          {boolean('children', false, 'test') && (
            <>
              <Button inverted color="white" padding="small">
                Publish
              </Button>
              <Button kind="simple" padding="small">
                Discard
              </Button>
            </>
          )}
        </ListItem>
      </Sanity>
    )
  })
