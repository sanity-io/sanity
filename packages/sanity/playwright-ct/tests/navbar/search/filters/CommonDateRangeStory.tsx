/* eslint-disable i18next/no-literal-string */
import {useState} from 'react'
import {CommonDateRangeInput} from '../../../../../src/core/studio/components/navbar/search/components/filters/filter/inputs/date/CommonDateRange'
import {OperatorDateRangeValue} from '../../../../../src/core/studio/components/navbar/search/definitions/operators/dateOperators'
import {TestWrapper} from '../../../formBuilder/utils/TestWrapper'
import {defineField, defineType} from 'sanity'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'tags',
        title: 'Tags',
        of: [{type: 'string'}],
        options: {layout: 'tags'},
      }),
    ],
  }),
]

export function CommonDateRangeStory({
  initialFocusedDate,
  initialValue,
}: {
  initialFocusedDate?: Date
  initialValue?: OperatorDateRangeValue
}) {
  const [value, setValue] = useState(initialValue || {from: null, to: null})
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <CommonDateRangeInput
        initialFocusedDate={initialFocusedDate}
        isDateTime={false}
        // eslint-disable-next-line react/jsx-no-bind
        onChange={(v) => setValue(v || {from: null, to: null})}
        value={value}
      />
    </TestWrapper>
  )
}
