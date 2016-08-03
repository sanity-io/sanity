import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'
import centered from '../storybook-addons/centered.js'
require('../storybook-addons/role.js')

import InfiniteCalendar from 'react-infinite-calendar'
import styles from './styles.css'
import 'react-infinite-calendar/styles.css'

storiesOf('Date pickers')
  .addDecorator(centered)
  .addWithRole(
  'Form-builder',
  `
    react-datepicker with customized styling
  `,
  'role:@sanity/form-builder/input/date',
  () => {

    return (
      <DatePicker />
    )
  },
  {PropTables: [DatePicker]}
)
.addWithRole(
'Form-builder (range)',
`
  react-datepicker with customized styling
`,
'role:@sanity/form-builder/input/date',
() => {

  return (
    <div>
      <DatePicker label="From" />
      <DatePicker label="To" />
    </div>
  )
},
{PropTables: [DatePicker]}
)
.addWithInfo(
'react-infinite-calendar',
`
  react-datepicker with customized styling
`,
() => {
  const today = new Date()
  const minDate = Number(new Date()) - ((24 * 60 * 60 * 1000) * 7)

  return (
    <div className={styles.container}>
      <InfiniteCalendar
        width={400}
        height={600}
        selectedDate={today}
        disabledDays={[0, 6]}
        minDate={minDate}
        keyboardSupport
      />
    </div>
  )
},
{PropTables: [InfiniteCalendar]}
)
