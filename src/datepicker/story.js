import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'

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
