import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import DatePicker from 'role:@sanity/form-builder/input/date'
import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'


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
  {inline: false, PropTables: [DatePicker]}
)
