import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {withKnobs, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import {range} from 'lodash'
import Chance from 'chance'

import ValidationStatus from 'part:@sanity/components/validation/status'
import ValidationList from 'part:@sanity/components/validation/list'
import ValidationListItem from './ValidationListItem'

const chance = new Chance()

const action = name => {
  console.log('action', name)
}

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

const singleMarker = [
  {
    item: {
      message: 'Required',
      name: 'ValidationError'
    },
    path: [],
    type: 'validation'
  }
]

const mockMarkers = length => {
  return range(length || 5).map((marker, i) => {
    return {
      type: 'validation',
      level: 'error',
      path: [`test_${i}`],
      item: {
        paths: [],
        path: ['title'],
        message: chance.sentence(),
        name: 'ValidationError'
      }
    }
  })
}

storiesOf('Validation')
  .addDecorator(withKnobs)
  .add('Status', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
          <ValidationStatus markers={mockMarkers()} onClick={() => action('onClick')} />
        </Sanity>
      </div>
    )
  })
  .add('List', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
          <ValidationList markers={mockMarkers()} truncate={boolean('truncate', false, 'props')} />
        </Sanity>
      </div>
    )
  })
  .add('ListItem', () => {
    const marker = object(
      'marker',
      {
        type: 'validation',
        level: 'error',
        path: ['test'],
        item: {
          paths: [],
          path: ['title'],
          message: 'The password must be at least 20 characters, have 5 special characters, minimum 5 lowercase and 2+3 uppercase letters, at least 5 numbers (sequences must not be a part if PI), 2 greek symbols and 5 emojis. Also not use your pet name or birthday of anyone in your family or city.',
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
  })
