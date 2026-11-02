import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {compileReleaseMetadataSchema} from '../compileReleaseMetadataType'
import {weakenReleaseMetadataReferences} from '../weakenReleaseMetadataReferences'

const parent = createSchema({
  name: 'workspace',
  types: [
    defineType({name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]}),
    defineType({name: 'weakAuthorRef', type: 'reference', weak: true, to: [{type: 'author'}]}),
  ],
})

const compiled = compileReleaseMetadataSchema(
  [
    defineField({name: 'note', type: 'string'}),
    defineField({name: 'inline', type: 'reference', to: [{type: 'author'}]}),
    defineField({name: 'aliased', type: 'weakAuthorRef'}),
    defineField({
      name: 'signOff',
      type: 'object',
      fields: [defineField({name: 'owner', type: 'reference', to: [{type: 'author'}]})],
    }),
  ],
  parent,
)

function weaken(metadata: Record<string, unknown>) {
  if (!compiled) throw new Error('schema did not compile')
  return weakenReleaseMetadataReferences(metadata, compiled.schemaType)
}

describe('weakenReleaseMetadataReferences', () => {
  it('sets _weak on a reference at the top level and inside an object', () => {
    expect(
      weaken({
        inline: {_type: 'reference', _ref: 'a'},
        aliased: {_type: 'weakAuthorRef', _ref: 'b'},
        signOff: {owner: {_type: 'reference', _ref: 'c'}},
      }),
    ).toEqual({
      inline: {_type: 'reference', _ref: 'a', _weak: true},
      aliased: {_type: 'weakAuthorRef', _ref: 'b', _weak: true},
      signOff: {owner: {_type: 'reference', _ref: 'c', _weak: true}},
    })
  })

  it('drops _strengthenOnPublish and keeps the other keys', () => {
    expect(
      weaken({
        releaseType: 'asap',
        inline: {
          _type: 'reference',
          _ref: 'a',
          _weak: true,
          _strengthenOnPublish: {type: 'author'},
        },
      }),
    ).toEqual({releaseType: 'asap', inline: {_type: 'reference', _ref: 'a', _weak: true}})
  })

  it('returns the same object when everything is already weak', () => {
    const metadata = {note: 'x', inline: {_type: 'reference', _ref: 'a', _weak: true}}
    expect(weaken(metadata)).toBe(metadata)
  })
})
