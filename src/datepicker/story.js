import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DatePicker from 'part:@sanity/form-builder/input/date?'


storiesOf('Date pickers')
.addWithInfo(
  'Form builder date picker',
  `
    Default tags
  `,
  () => {
    const field = {
      name: 'fieldName',
      precision: 'minute',
      title: 'Field title',
      type: 'date'
    }
    return (
      <div>
        {
          DatePicker && <DatePicker field={field} onChange={action('onChange')} />
        }
      </div>
    )
  },
  {
    propTables: [DatePicker],
    role: 'part:@sanity/form-builder/input/date'
  }
)
