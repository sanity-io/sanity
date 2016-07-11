import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'

storiesOf('Date pickers').addWithInfo(
  'react-datepicker',
  `
    react-datepicker with customized styling
  `,
  () => {

    return (
      <div>
        <h2>This is the date picker</h2>
        <DatePicker />
      </div>
    )
  },
  {inline: true}
)
