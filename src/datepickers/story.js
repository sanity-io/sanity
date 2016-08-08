import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'
import InfiniteCalendar from 'react-infinite-calendar'
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
  {PropTables: [DatePicker], role: 'role:@sanity/form-builder/input/date'}
)
.addWithInfo(
'Form-builder (range)',
`
  react-datepicker with customized styling
`,
() => {

  return (
    <div>
      <DatePicker label="From" />
      <DatePicker label="To" />
    </div>
  )
},
{PropTables: [DatePicker], role: 'role:@sanity/form-builder/input/date'}
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
