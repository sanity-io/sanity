import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, number, boolean, color} from 'part:@sanity/storybook/addons/knobs'
// import Sanity from 'part:@sanity/storybook/addons/sanity'
import PresenceCircles from './PresenceCircles'
import PresenceCircle from './PresenceCircle'
import {range} from 'lodash'
import Chance from 'chance'
import colorHasher from './colorHasher'
import PresenceList from './PresenceList'

const chance = new Chance()

const markers = range(50).map(marker => {
  return {
    type: 'presence',
    identity: chance.geohash({length: 9}),
    session: chance.guid(),
    color: chance.color(),
    user: {
      displayName: chance.name(),
      imageUrl: `https://placeimg.com/64/64/any?${Math.random()*1000}`
    }
  }
})

storiesOf('Presence')
  .addDecorator(withKnobs)
  .add('Circles', () => {
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
  })

  .add('Circle', () => {
    return (
      <div style={{fontSize: '2em'}}>
        <PresenceCircle
          text={text('text', 'KG', 'props')}
          title={text('title', undefined, 'props')}
          animateOnHover={boolean('animateOnHover', false, 'props')}
          interactive={boolean('interactive', false, 'props')}
          imageUrl={text('imageUrl', 'https://placeimg.com/64/64', 'props')}
          color={color('color', '#D0021B', 'props')}
        />
      </div>
    )
  })

  .add('List', () => {
    return <PresenceList markers={markers} />
  })

  .add('colorHasher', () => {
    const color = colorHasher(text('string'))
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: color
        }}
      />
    )
  })
