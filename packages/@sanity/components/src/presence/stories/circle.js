import React from 'react'
import {text, boolean, color} from 'part:@sanity/storybook/addons/knobs'
import PresenceCircle from '../PresenceCircle'

export function CircleStory() {
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
}
