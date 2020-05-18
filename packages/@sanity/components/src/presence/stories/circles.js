import React from 'react'
import {number, boolean, color} from 'part:@sanity/storybook/addons/knobs'
import PresenceCircles from '../PresenceCircles'
import {range} from 'lodash'
import Chance from 'chance'

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

export function CirclesStory() {
  const showImage = boolean('show image', true, 'test')
  const backgroundColor = color('background color', '#ccc', 'test')
  const newMarkers = markers.map(marker => {
    return {
      ...marker,
      user: {
        ...marker.user,
        imageUrl: showImage ? marker.user.imageUrl : undefined
      }
    }
  })

  return (
    <div style={{padding: '2em', backgroundColor, position: 'relative'}}>
      <PresenceCircles markers={newMarkers.slice(0, number('Number of markers', 10, 'test'))} />
    </div>
  )
}
