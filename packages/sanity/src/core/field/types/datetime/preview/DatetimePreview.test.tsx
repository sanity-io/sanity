import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type StringSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'

import {DatetimePreview} from './DatetimePreview'

const schema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'article',
      type: 'document',
      fields: [
        {name: 'publishedOn', type: 'date', title: 'Published on'},
        {
          name: 'due',
          type: 'date',
          title: 'Due',
          options: {dateFormat: 'MMMM D, YYYY'},
        },
        {name: 'anniversary', type: 'anniversary', title: 'Anniversary'},
        {name: 'startsAt', type: 'datetime', title: 'Starts at'},
      ],
    },
    {
      name: 'anniversary',
      type: 'date',
      title: 'Anniversary',
      options: {dateFormat: 'DD/MM/YYYY'},
    },
  ],
})

function fieldSchemaType(name: string): StringSchemaType {
  const article = schema.get('article')
  if (!article || article.jsonType !== 'object') {
    throw new Error('Expected article to be an object type')
  }
  const field = (article as ObjectSchemaType).fields.find((candidate) => candidate.name === name)
  if (!field || field.type.jsonType !== 'string') {
    throw new Error(`Expected ${name} to be a string schema type`)
  }
  return field.type
}

describe('DatetimePreview', () => {
  test('the suite timezone is west of UTC, where the date-only UTC parse shifts a day', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
    expect(new Date('2026-09-20').getDate()).toBe(19)
  })

  test('shows the calendar day stored on a date field', () => {
    render(<DatetimePreview schemaType={fieldSchemaType('publishedOn')} value="2026-09-20" />)

    expect(screen.getByText('2026-09-20')).toBeInTheDocument()
  })

  test('formats a date field with its configured date format', () => {
    render(<DatetimePreview schemaType={fieldSchemaType('due')} value="2026-09-20" />)

    expect(screen.getByText('September 20, 2026')).toBeInTheDocument()
  })

  test('shows the calendar day for a type that extends date', () => {
    render(<DatetimePreview schemaType={fieldSchemaType('anniversary')} value="2026-09-20" />)

    expect(screen.getByText('20/09/2026')).toBeInTheDocument()
  })

  test('formats a datetime field in the local timezone', () => {
    render(
      <DatetimePreview schemaType={fieldSchemaType('startsAt')} value="2026-09-20T04:00:00.000Z" />,
    )

    // 04:00 UTC is 21:00 the previous evening in Pacific Daylight Time.
    expect(screen.getByText('2026-09-19 21:00')).toBeInTheDocument()
  })
})
