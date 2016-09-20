import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DatePicker from 'part:@sanity/form-builder/input/date'

storiesOf('Icons').addWithInfo(
  'Date picker',
  `
    react-datepicker with customized styling
  `,
  () => {

    return (
      <DatePicker />
    )
  },
  {inline: true}
)
