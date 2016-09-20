import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DatePicker from 'part:@sanity/form-builder/input/date'

storiesOf('Date pickers').addWithInfo(
  'react-datepicker',
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
