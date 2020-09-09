import Chance from 'chance'
import {range} from 'lodash'
import ValidationStatus from 'part:@sanity/components/validation/status'
import ValidationList from 'part:@sanity/components/validation/list'
import {boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import {Marker} from '../../types'

import styles from './list.css'

const chance = new Chance()

const mockMarkers = (length = 5): Marker[] => {
  return range(length).map((marker, i) => {
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
    <CenteredContainer background={false}>
      <Sanity part="part:@sanity/components/validation/status" propTables={[ValidationStatus]}>
        <div className={styles.root}>
          <ValidationList markers={mockMarkers()} truncate={boolean('truncate', false, 'props')} />
        </div>
      </Sanity>
    </CenteredContainer>
  )
}
