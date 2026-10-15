import {Schema} from '@sanity/schema'
import {extractSchema} from '@sanity/schema/_internal'
import {describe, expect, it} from 'vitest'

import {findParamNames, inferQueryParams} from './paramInference'

const schema = extractSchema(
  Schema.compile({
    name: 'test',
    types: [
      {name: 'slug', type: 'object', fields: [{name: 'current', type: 'string'}]},
      {
        name: 'post',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug'},
          {name: 'status', type: 'string', options: {list: ['draft', 'review', 'published']}},
          {name: 'rating', type: 'number'},
          {name: 'featured', type: 'boolean'},
          {name: 'tags', type: 'array', of: [{type: 'string'}]},
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
        ],
      },
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    ],
  }),
)

const documentTypes = ['author', 'post']

function typeOf(query: string, name: string, withSchema = true) {
  const inference = inferQueryParams(query, withSchema ? {schema, documentTypes} : {documentTypes})
  return inference.params.find((param) => param.name === name)?.type
}

describe('findParamNames', () => {
  it('lists the params in order, once, outside strings and comments', () => {
    expect(
      findParamNames(
        [
          '// $commented',
          '*[_type == $type && title == "$quoted \\" $still" && slug.current == \'$single\']',
          '[0...$limit]{"x": $type, $other}',
        ].join('\n'),
      ),
    ).toEqual(['type', 'limit', 'other'])
  })
})

describe('inferQueryParams', () => {
  it('finds nothing in a query without params', () => {
    expect(inferQueryParams('*[_type == "post"]')).toEqual({params: [], syntaxError: false})
  })

  it('types slice bounds as whole numbers, written out as the slice', () => {
    const inference = inferQueryParams('*[_type == $type] | order(_createdAt)[$start...$end]')
    expect(inference.syntaxError).toBe(false)
    expect(
      inference.params.map(({name, type, usages}) => ({name, kind: type.kind, usages})),
    ).toEqual([
      {name: 'type', kind: 'string', usages: ['_type == $type']},
      {name: 'start', kind: 'integer', usages: ['[$start...$end]']},
      {name: 'end', kind: 'integer', usages: ['[$start...$end]']},
    ])
  })

  it('offers the document types for _type, from the schema or the workspace', () => {
    expect(typeOf('*[_type == $type]', 'type')).toEqual({
      kind: 'string',
      array: false,
      options: ['author', 'post'],
      format: 'document-type',
    })
    expect(typeOf('*[$type == _type]', 'type', false)).toEqual({
      kind: 'string',
      array: false,
      options: documentTypes,
      format: 'document-type',
    })
    expect(typeOf('*[_type in $types]', 'types', false)).toEqual({
      kind: 'string',
      array: true,
      options: documentTypes,
      format: 'document-type',
    })
  })

  it('does not offer document types for the _type of objects inside documents', () => {
    expect(typeOf('*[_type == "post"]{"blocks": body[_type == $block]}', 'block', false)).toEqual({
      kind: 'string',
      array: false,
    })
  })

  it('types fields from the schema, narrowed by the filter', () => {
    expect(typeOf('*[_type == "post" && slug.current == $slug][0]', 'slug')).toEqual({
      kind: 'string',
      array: false,
    })
    expect(typeOf('*[_type == "post" && status == $status]', 'status')).toEqual({
      kind: 'string',
      array: false,
      options: ['draft', 'published', 'review'],
    })
    expect(typeOf('*[_type == "post" && rating >= $min]', 'min')?.kind).toBe('number')
    expect(typeOf('*[_type == "post" && featured == $featured]', 'featured')?.kind).toBe('boolean')
    expect(typeOf('*[_type == "post" && author->name == $author]', 'author')?.kind).toBe('string')
    // Without a schema the field could hold anything
    expect(typeOf('*[_type == "post" && slug.current == $slug]', 'slug', false)?.kind).toBe('any')
  })

  it('types membership both ways', () => {
    expect(typeOf('*[_type == "post" && $tag in tags[]]', 'tag')).toEqual({
      kind: 'string',
      array: false,
    })
    expect(typeOf('*[_type == "post" && status in $statuses]', 'statuses')).toEqual({
      kind: 'string',
      array: true,
      options: ['draft', 'published', 'review'],
    })
  })

  it('knows what functions, matching and system fields expect', () => {
    expect(typeOf('*[references($id)]', 'id', false)).toEqual({
      kind: 'string',
      array: false,
      format: 'document-id',
    })
    expect(typeOf('*[title match $q]', 'q', false)?.kind).toBe('string')
    expect(typeOf('*[dateTime(_updatedAt) > dateTime($since)]', 'since', false)?.format).toBe(
      'datetime',
    )
    // The schema says string, the query says when
    expect(typeOf('*[_updatedAt > $since]', 'since')).toEqual({
      kind: 'string',
      array: false,
      format: 'datetime',
    })
    expect(typeOf('*[_id == $id]', 'id')?.format).toBe('document-id')
    expect(typeOf('*[count(tags) > $n]', 'n', false)?.kind).toBe('number')
    expect(typeOf('*[!$hidden]', 'hidden', false)?.kind).toBe('boolean')
    expect(typeOf('*[]{"x": select($flag => 1, 2)}', 'flag', false)?.kind).toBe('boolean')
  })

  it('types params of nested queries in their own scope', () => {
    const inference = inferQueryParams(
      '*[_type == "post"]{title, "related": *[_type == "post" && _id != $current && status == $status]}',
      {schema, documentTypes},
    )
    expect(inference.params.map(({name, type}) => [name, type])).toEqual([
      ['current', {kind: 'string', array: false, format: 'document-id'}],
      ['status', {kind: 'string', array: false, options: ['draft', 'published', 'review']}],
    ])
  })

  it('lists params it cannot type, with where they are used', () => {
    const inference = inferQueryParams(
      '*[_type == "post"]{title, "extra": $extra, "same": $a == $b}',
    )
    expect(inference.params).toEqual([
      {name: 'extra', type: {kind: 'any', array: false}, usages: ['$extra']},
      {name: 'a', type: {kind: 'any', array: false}, usages: ['$a == $b']},
      {name: 'b', type: {kind: 'any', array: false}, usages: ['$a == $b']},
    ])
  })

  it('merges the usages of a param', () => {
    const inference = inferQueryParams('*[_type == $type || $type == "post"][0...$limit]', {
      documentTypes,
    })
    expect(inference.params[0]).toEqual({
      name: 'type',
      type: {kind: 'string', array: false, options: documentTypes, format: 'document-type'},
      usages: ['_type == $type', '$type == "post"'],
    })
  })

  it('lists the params of a query that does not parse, without types', () => {
    const inference = inferQueryParams('*[_type == $type && title == $title', {
      schema,
      documentTypes,
    })
    expect(inference).toEqual({
      params: [
        {name: 'type', type: {kind: 'any', array: false}, usages: []},
        {name: 'title', type: {kind: 'any', array: false}, usages: []},
      ],
      syntaxError: true,
    })
  })
})
