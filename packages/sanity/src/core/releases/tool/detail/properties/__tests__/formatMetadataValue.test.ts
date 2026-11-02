import {defineField, type FieldDefinition, type ObjectField, type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../../../schema/createSchema'
import {compileReleaseMetadataSchema} from '../../../../metadata/compileReleaseMetadataType'
import {formatMetadataValue, type MetadataFormatters} from '../formatMetadataValue'

const formatters: MetadataFormatters = {
  number: new Intl.NumberFormat('en-US'),
  date: new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeZone: 'UTC'}),
  datetime: new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'short'}),
  yes: 'Yes',
  no: 'No',
}

function compiledType(field: FieldDefinition): SchemaType {
  const compiled = compileReleaseMetadataSchema([field], createSchema({name: 'test', types: []}))
  const type = compiled?.schemaType.fields[0]?.type
  if (!type) throw new Error(`field "${field.name}" did not compile`)
  return type
}

function format(
  field: FieldDefinition,
  value: unknown,
  isFieldHidden: (nested: ObjectField) => boolean = () => false,
) {
  return formatMetadataValue({type: compiledType(field), value, formatters, isFieldHidden})
}

describe('formatMetadataValue', () => {
  it('shows the title of a list option given as a string or an object', () => {
    const channel = defineField({
      name: 'channel',
      type: 'string',
      options: {list: ['email', {title: 'Web site', value: 'web'}]},
    })

    expect(format(channel, 'email')).toEqual({status: 'value', text: 'email'})
    expect(format(channel, 'web')).toEqual({status: 'value', text: 'Web site'})
    expect(format(channel, 'unlisted')).toEqual({status: 'value', text: 'unlisted'})
  })

  it('formats a date without shifting it to the viewer time zone', () => {
    const day = defineField({name: 'day', type: 'date'})

    expect(format(day, '2026-01-01')).toEqual({status: 'value', text: 'Jan 1, 2026'})
    expect(format(day, 'next week')).toEqual({
      status: 'unsupported',
      reason: '"next week" is not a YYYY-MM-DD date',
    })
  })

  it('reports a datetime that does not parse', () => {
    expect(format(defineField({name: 'at', type: 'datetime'}), 'soon')).toEqual({
      status: 'unsupported',
      reason: '"soon" is not a date and time',
    })
  })

  it('reports a number that is not finite', () => {
    expect(format(defineField({name: 'budget', type: 'number'}), Number.NaN)).toEqual({
      status: 'unsupported',
      reason: 'expected a number value, but received number',
    })
  })

  it('lists only the set, visible fields of an object', () => {
    const signOff = defineField({
      name: 'signOff',
      type: 'object',
      fields: [
        defineField({name: 'reviewer', title: 'Reviewer', type: 'string'}),
        defineField({name: 'note', title: 'Note', type: 'string'}),
        defineField({name: 'approved', title: 'Approved', type: 'boolean'}),
      ],
    })

    expect(
      format(
        signOff,
        {reviewer: 'Ana Silva', note: 'Secret', approved: true},
        (field) => field.name === 'note',
      ),
    ).toEqual({status: 'value', text: 'Reviewer: Ana Silva · Approved: Yes'})
    expect(format(signOff, {note: ''})).toEqual({status: 'empty'})
  })

  it('reports an object with a nested object, which does not fit on one line', () => {
    const outer = defineField({
      name: 'outer',
      type: 'object',
      fields: [
        defineField({
          name: 'inner',
          type: 'object',
          fields: [defineField({name: 'name', type: 'string'})],
        }),
      ],
    })

    expect(format(outer, {inner: {name: 'x'}})).toEqual({
      status: 'unsupported',
      reason: 'field "inner" is a nested object',
    })
  })

  it('reports a value whose shape does not match an object type', () => {
    const signOff = defineField({
      name: 'signOff',
      type: 'object',
      fields: [defineField({name: 'reviewer', type: 'string'})],
    })

    expect(format(signOff, ['Ana'])).toEqual({
      status: 'unsupported',
      reason: 'expected a object value, but received array',
    })
  })
})
