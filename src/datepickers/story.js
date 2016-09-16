import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DatePicker from 'part:@sanity/form-builder/input/date'
import styles from './styles.css'
import 'react-infinite-calendar/styles.css'

storiesOf('Date pickers')
  .addWithInfo(
  'Form-builder',
  `
    react-datepicker with customized styling
  `,
  () => {

    return (
      <DatePicker />
    )
  },
  {PropTables: [DatePicker], role: 'part:@sanity/form-builder/input/date'}
)
