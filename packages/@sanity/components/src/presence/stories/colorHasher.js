import React from 'react'
import {text} from 'part:@sanity/storybook/addons/knobs'
import colorHasher from '../colorHasher'

export function ColorHasherStory() {
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
}
