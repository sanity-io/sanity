import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import RichDateInput from 'part:@sanity/form-builder/input/rich-date'

storiesOf('Icons').add(
  'Date picker',
  () => {

    return (
      <RichDateInput />
    )
  }
)
