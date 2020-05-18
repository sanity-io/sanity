import React from 'react'
import {range} from 'lodash'
import Chance from 'chance'
import PresenceList from '../PresenceList'

const chance = new Chance()

const markers = range(50).map(marker => {
  return {
    type: 'presence',
    identity: chance.geohash({length: 9}),
    session: chance.guid(),
    color: chance.color(),
    user: {
      displayName: chance.name(),
      imageUrl: `https://placeimg.com/64/64/any?${Math.random() * 1000}`
    }
  }
})

export function ListStory() {
  return <PresenceList markers={markers} />
}
