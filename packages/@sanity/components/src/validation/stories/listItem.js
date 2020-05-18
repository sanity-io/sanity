import {boolean, object} from 'part:@sanity/storybook/addons/knobs'
import React from 'react'
import ValidationListItem from '../ValidationListItem'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  boxSizing: 'border-box',
  padding: '2rem',
  top: 0,
  left: 0
}

export function ListItemStory() {
  const marker = object(
    'marker',
    {
      type: 'validation',
      level: 'error',
      path: ['test'],
      item: {
        paths: [],
        path: ['title'],
        message:
          'The password must be at least 20 characters, have 5 special characters, minimum 5 lowercase and 2+3 uppercase letters, at least 5 numbers (sequences must not be a part if PI), 2 greek symbols and 5 emojis. Also not use your pet name or birthday of anyone in your family or city.',
        name: 'ValidationError'
      }
    },
    'props'
  )
  return (
    <div style={centerStyle}>
      <ValidationListItem marker={marker} truncate={boolean('truncate', false, 'props')} />
    </div>
  )
}
