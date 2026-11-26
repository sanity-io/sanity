import {diffInput, wrap} from '@sanity/diff'
import {defineArrayMember, defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {type ObjectDiff} from '../../types'
import {getChangedFieldTitles} from './getChangedFieldTitles'

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'author',
      type: 'document',
      fields: [
        defineField({name: 'name', type: 'string', title: 'Name'}),
        defineField({name: 'role', type: 'string', title: 'Role'}),
        defineField({
          name: 'translations',
          type: 'object',
          title: 'Translations',
          fields: [
            defineField({name: 'sv', type: 'string', title: 'Swedish'}),
            defineField({name: 'no', type: 'string', title: 'Norwegian'}),
          ],
        }),
        defineField({
          name: 'reviews',
          type: 'array',
          title: 'Reviews',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'review',
              fields: [defineField({name: 'title', type: 'string', title: 'Title'})],
            }),
          ],
        }),
      ],
    }),
  ],
})
const authorType = schema.get('author') as ObjectSchemaType

const diff = (from: Record<string, unknown>, to: Record<string, unknown>) =>
  diffInput(wrap(from, null), wrap(to, null)) as ObjectDiff

describe('getChangedFieldTitles', () => {
  it('lists the title paths of the changed fields, in schema order', () => {
    expect(
      getChangedFieldTitles(
        authorType,
        diff({name: 'Ada', role: 'designer'}, {role: 'developer', name: 'Ada Lovelace'}),
      ),
    ).toEqual([['Name'], ['Role']])
  })

  it('leaves out the fields that did not change', () => {
    expect(
      getChangedFieldTitles(authorType, diff({name: 'Ada', role: 'x'}, {name: 'Ada', role: 'y'})),
    ).toEqual([['Role']])
    expect(getChangedFieldTitles(authorType, diff({name: 'Ada'}, {name: 'Ada'}))).toEqual([])
  })

  it('heads a nested field with the titles of the objects it is in', () => {
    expect(
      getChangedFieldTitles(
        authorType,
        diff({translations: {sv: 'Ada'}}, {translations: {sv: 'Ada', no: 'Ada'}}),
      ),
    ).toEqual([['Translations', 'Norwegian']])
  })

  it('heads every change of an object with its title when it changed several fields', () => {
    expect(
      getChangedFieldTitles(authorType, diff({}, {translations: {sv: 'Ada', no: 'Ada'}})),
    ).toEqual([
      ['Translations', 'Swedish'],
      ['Translations', 'Norwegian'],
    ])
  })

  it('heads every item of an array with its title when several items changed', () => {
    expect(
      getChangedFieldTitles(
        authorType,
        diff(
          {},
          {
            reviews: [
              {_key: 'a', _type: 'review', title: 'Good'},
              {_key: 'b', _type: 'review', title: 'Great'},
            ],
          },
        ),
      ),
    ).toEqual([
      ['Reviews', '#1', 'Title'],
      ['Reviews', '#2', 'Title'],
    ])
  })

  it('heads a field of an array item with the position of the item', () => {
    expect(
      getChangedFieldTitles(
        authorType,
        diff(
          {reviews: [{_key: 'a', _type: 'review', title: 'Good'}]},
          {reviews: [{_key: 'a', _type: 'review', title: 'Great'}]},
        ),
      ),
    ).toEqual([['Reviews', '#1', 'Title']])
  })
})
