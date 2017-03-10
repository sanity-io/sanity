import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DatePicker from 'part:@sanity/form-builder/input/date'

storiesOf('Icons').add(
  'Date picker',
  () => {

    return (
      <DatePicker />
    )
  }
)
