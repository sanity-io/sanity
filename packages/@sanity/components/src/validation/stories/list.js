import Chance from 'chance'
import {range} from 'lodash'
import ValidationStatus from 'part:@sanity/components/validation/status'
import ValidationList from 'part:@sanity/components/validation/list'
import {boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const chance = new Chance()

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

export function ListStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
        <ValidationList markers={mockMarkers()} truncate={boolean('truncate', false, 'props')} />
      </Sanity>
    </div>
  )
}
