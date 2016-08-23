import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'

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
