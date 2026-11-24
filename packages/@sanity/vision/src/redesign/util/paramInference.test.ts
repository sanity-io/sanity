import {describe, expect, it} from 'vitest'

import {documentTypes, schema, STATUSES} from '../../../test/paramsFixtures'
import {findParamNames, inferQueryParams, type InferParamsOptions} from './paramInference'

const WITH_SCHEMA: InferParamsOptions = {schema, documentTypes}
const WITHOUT_SCHEMA: InferParamsOptions = {documentTypes}

const STATUS_OPTIONS = STATUSES.toSorted()

function paramOf(query: string, name: string, options = WITH_SCHEMA) {
  const param = inferQueryParams(query, options).params.find((each) => each.name === name)
  if (!param) throw new Error(`No param ${name} in ${query}`)
  return param
}

function typeOf(query: string, name: string, options = WITH_SCHEMA) {
  return paramOf(query, name, options).type
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

  it('leaves out the parameter of a custom function within its declaration', () => {
    expect(
      findParamNames(
        [
          'fn my::asset($asset) = $asset->{url, originalFilename};',
          'fn my::named($q) = $q{title};',
          '*[_type == "icon" && filename match $q]{"image": my::asset(image.asset), "n": $limit}',
        ].join('\n'),
      ),
    ).toEqual(['q', 'limit'])
  })
})

describe('inferQueryParams', () => {
  it('finds nothing in a query without params', () => {
    expect(inferQueryParams('*[_type == "post"]')).toEqual({params: [], syntaxError: false})
  })

  it('types the argument of text::semanticSimilarity as a string', () => {
    const param = paramOf(
      '*[_type == "pokemon"] | score(text::semanticSimilarity($description)) | order(_score desc)[0...10]',
      'description',
    )
    expect(param).toEqual({
      name: 'description',
      node: {type: 'string'},
      type: {kind: 'string', array: false},
      usages: ['text::semanticSimilarity($description)'],
    })
  })

  it('does not offer the parameters of the custom functions the query declares', () => {
    const inference = inferQueryParams(
      [
        'fn my::asset($asset) = $asset->{url, metadata, originalFilename, size};',
        '*[_type == "icon"] | score(boost(filename match $q + "*", 8)) | order(_score desc)[0...10]',
        '{_id, "image": my::asset(image.asset)}',
      ].join('\n'),
    )
    expect(inference.syntaxError).toBe(false)
    expect(inference.params.map(({name, type}) => ({name, kind: type.kind}))).toEqual([
      {name: 'q', kind: 'string'},
    ])
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
    const documentType = {
      kind: 'string',
      array: false,
      options: documentTypes,
      format: 'document-type',
    }
    expect(typeOf('*[_type == $type]', 'type')).toEqual(documentType)
    expect(typeOf('*[$type == _type]', 'type', WITHOUT_SCHEMA)).toEqual(documentType)
    expect(typeOf('*[_type in $types]', 'types', WITHOUT_SCHEMA)).toEqual({
      ...documentType,
      array: true,
    })
  })

  it('does not offer document types for the _type of objects inside documents', () => {
    expect(
      typeOf('*[_type == "post"]{"blocks": body[_type == $block]}', 'block', WITHOUT_SCHEMA),
    ).toEqual({kind: 'string', array: false})
  })

  it('types fields from the schema, narrowed by the filter', () => {
    expect(typeOf('*[_type == "post" && slug.current == $slug][0]', 'slug')).toEqual({
      kind: 'string',
      array: false,
    })
    expect(paramOf('*[_type == "post" && status == $status]', 'status')).toMatchObject({
      node: {type: 'union', of: STATUS_OPTIONS.map((value) => ({type: 'string', value}))},
      type: {kind: 'string', array: false, options: STATUS_OPTIONS},
    })
    expect(typeOf('*[_type == "post" && views >= $min]', 'min').kind).toBe('number')
    expect(typeOf('*[_type == "post" && featured == $featured]', 'featured').kind).toBe('boolean')
    expect(typeOf('*[_type == "post" && author->name == $author]', 'author').kind).toBe('string')
    expect(typeOf('*[_type == "post" && author._ref == $author]', 'author')).toEqual({
      kind: 'string',
      array: false,
      format: 'document-id',
    })
  })

  it('says why a field the schema does not type leaves its param untyped', () => {
    expect(paramOf('*[_type == "post" && slug.current == $slug]', 'slug', WITHOUT_SCHEMA)).toEqual({
      name: 'slug',
      node: {type: 'unknown'},
      type: {kind: 'any', array: false},
      usages: ['slug.current == $slug'],
      reason: '`slug.current`, which it is compared with, needs the workspace schema to be typed',
    })
    expect(paramOf('*[_type == "post" && subtitle == $subtitle]', 'subtitle').reason).toBe(
      'the schema does not type `subtitle`, which it is compared with',
    )
  })

  it('types membership both ways', () => {
    expect(typeOf('*[_type == "post" && $tag in tags[]]', 'tag')).toEqual({
      kind: 'string',
      array: false,
    })
    expect(typeOf('*[_type == "post" && status in $statuses]', 'statuses')).toEqual({
      kind: 'string',
      array: true,
      options: STATUS_OPTIONS,
    })
    expect(typeOf('*[_type == "post" && _id in $ids]', 'ids')).toEqual({
      kind: 'string',
      array: true,
      format: 'document-id',
    })
    expect(typeOf('*[_type == "post" && $category in categories[]._ref]', 'category')).toEqual({
      kind: 'string',
      array: false,
      format: 'document-id',
    })
    expect(typeOf('*[_type == "post" && $id in *[_type == "author"]._id]', 'id')).toEqual({
      kind: 'string',
      array: false,
      format: 'document-id',
    })
  })

  it('knows what functions, matching and system fields expect', () => {
    expect(typeOf('*[references($id)]', 'id', WITHOUT_SCHEMA)).toEqual({
      kind: 'string',
      array: false,
      format: 'document-id',
    })
    expect(typeOf('*[title match $q]', 'q', WITHOUT_SCHEMA).kind).toBe('string')
    expect(typeOf('*[dateTime(_updatedAt) > dateTime($since)]', 'since', WITHOUT_SCHEMA)).toEqual({
      kind: 'string',
      array: false,
      format: 'datetime',
    })
    // The schema says string, the query says when
    expect(typeOf('*[_updatedAt > $since]', 'since')).toEqual({
      kind: 'string',
      array: false,
      format: 'datetime',
    })
    expect(typeOf('*[_id == $id]', 'id').format).toBe('document-id')
    expect(typeOf('*[count(tags) > $n]', 'n', WITHOUT_SCHEMA)).toEqual({
      kind: 'integer',
      array: false,
      min: 0,
    })
    expect(typeOf('*[length(title) < $max]', 'max', WITHOUT_SCHEMA)).toEqual({
      kind: 'integer',
      array: false,
      min: 0,
    })
    expect(typeOf('*[!$hidden]', 'hidden', WITHOUT_SCHEMA).kind).toBe('boolean')
    expect(typeOf('*[]{"x": select($flag => 1, 2)}', 'flag', WITHOUT_SCHEMA).kind).toBe('boolean')
    expect(typeOf('*[string::startsWith(title, $prefix)]', 'prefix', WITHOUT_SCHEMA).kind).toBe(
      'string',
    )
    expect(typeOf('*[round(views, $digits) > 1]', 'digits', WITHOUT_SCHEMA)).toEqual({
      kind: 'integer',
      array: false,
      min: 0,
    })
    // `round()` with no arguments does not parse, and inference still lists the other params
    expect(() => inferQueryParams('*[round() && $ok]')).not.toThrow()
    expect(inferQueryParams('*[round() && $ok]').params.map((param) => param.name)).toEqual(['ok'])
    expect(typeOf('*[]{"n": math::sum($values)}', 'values', WITHOUT_SCHEMA)).toEqual({
      kind: 'number',
      array: true,
    })
  })

  it('types each side of a match, and what a plus adds a param to', () => {
    // `match` takes strings on either side, whatever the other side is
    expect(typeOf('*[$text match $pattern]', 'text', WITHOUT_SCHEMA).kind).toBe('string')
    expect(typeOf('*[$text match $pattern]', 'pattern', WITHOUT_SCHEMA).kind).toBe('string')
    // `+` joins lists and merges objects as well as adding numbers and strings
    expect(typeOf('*[_type == "post"]{"all": $extra + tags}', 'extra')).toEqual({
      kind: 'string',
      array: true,
    })
    expect(typeOf('*[_type == "post"]{"label": title + $suffix}', 'suffix').kind).toBe('string')
    expect(paramOf('*[_type == "post"]{"place": location + $place}', 'place').node).toEqual({
      type: 'inline',
      name: 'geopoint',
    })
    // A list or object literal stands for lists or objects of its primitives, not its values
    expect(typeOf('*[_type == "post"]{"all": $more + ["a", "b"]}', 'more')).toEqual({
      kind: 'string',
      array: true,
    })
    expect(paramOf('*[_type == "post"]{"merged": $base + {"n": 1}}', 'base').node).toEqual({
      type: 'object',
      attributes: {n: {type: 'objectAttribute', value: {type: 'number'}}},
    })
    expect(paramOf('*[_type == "post"]{"t": coalesce($tags, ["news"])}', 'tags').node).toEqual({
      type: 'array',
      of: {type: 'string'},
    })
    // `count()` is a whole number from 0, but what is added to it or stands in for it need not be
    expect(typeOf('*[count(tags) + $offset > 2]', 'offset', WITHOUT_SCHEMA)).toEqual({
      kind: 'number',
      array: false,
    })
    expect(typeOf('*[]{"n": coalesce($n, count(tags))}', 'n', WITHOUT_SCHEMA)).toEqual({
      kind: 'number',
      array: false,
    })
  })

  it('types params of nested queries in their own scope', () => {
    const inference = inferQueryParams(
      '*[_type == "post"]{title, "related": *[_type == "post" && _id != $current && status == $status]}',
      WITH_SCHEMA,
    )
    expect(inference.params.map(({name, type}) => [name, type])).toEqual([
      ['current', {kind: 'string', array: false, format: 'document-id'}],
      ['status', {kind: 'string', array: false, options: STATUS_OPTIONS}],
    ])
  })

  it('reads the comparisons of a filter that also checks another param', () => {
    expect(typeOf('*[_type == "post" && count($ids) > 0 && status == $status]', 'status')).toEqual({
      kind: 'string',
      array: false,
      options: STATUS_OPTIONS,
    })
    expect(typeOf('*[_type == "post" && array::intersects(tags, $tags)]', 'tags')).toEqual({
      kind: 'string',
      array: true,
    })
    // Lists intersect on equal elements, and objects never are: a list of references takes any
    // list, the IDs they hold a list of IDs
    expect(
      paramOf('*[_type == "post" && array::intersects(categories, $categories)]', 'categories')
        .node,
    ).toEqual({type: 'array', of: {type: 'unknown'}})
    expect(
      typeOf('*[_type == "post" && array::intersects(categories[]._ref, $ids)]', 'ids'),
    ).toEqual({kind: 'string', array: true, format: 'document-id'})
  })

  it('lists params it cannot type, with where they are used and why', () => {
    const inference = inferQueryParams(
      '*[_type == "post"]{title, "extra": $extra, "same": $a == $b}',
    )
    expect(
      inference.params.map(({name, type, usages, reason}) => ({name, type, usages, reason})),
    ).toEqual([
      {
        name: 'extra',
        type: {kind: 'any', array: false},
        usages: ['$extra'],
        reason: 'the query only returns it',
      },
      {
        name: 'a',
        type: {kind: 'any', array: false},
        usages: ['$a == $b'],
        reason: 'it is only compared with `$b`, which is not typed either',
      },
      {
        name: 'b',
        type: {kind: 'any', array: false},
        usages: ['$a == $b'],
        reason: 'it is only compared with `$a`, which is not typed either',
      },
    ])
  })

  it('types a param from its current value only when the query says nothing about it', () => {
    const query = '*[_type == "post" && status == $status]{"extra": $extra}'
    const values = {status: 42, extra: ['a', 'b']}
    const {params} = inferQueryParams(query, {...WITH_SCHEMA, values})
    expect(params.map(({name, type, valueNode}) => ({name, kind: type.kind, valueNode}))).toEqual([
      {name: 'status', kind: 'string', valueNode: undefined},
      {name: 'extra', kind: 'any', valueNode: {type: 'array', of: {type: 'string'}}},
    ])
  })

  it('takes what all uses of a param accept, or any of them when they accept nothing in common', () => {
    expect(
      paramOf('*[_type == "post" && $mode == "draft" && $mode in ["draft", "review"]]', 'mode')
        .node,
    ).toEqual({
      type: 'union',
      of: [
        {type: 'string', value: 'draft'},
        {type: 'string', value: 'review'},
      ],
    })
    expect(
      paramOf('*[_type == "post" && ($value == views || $value == title)]', 'value').node,
    ).toEqual({
      type: 'union',
      of: [{type: 'number'}, {type: 'string'}],
    })
  })

  it('merges the usages of a param', () => {
    const inference = inferQueryParams('*[_type == $type || $type == "post"][0...$limit]', {
      documentTypes,
    })
    expect(inference.params[0]).toMatchObject({
      name: 'type',
      type: {kind: 'string', array: false, options: documentTypes, format: 'document-type'},
      usages: ['_type == $type', '$type == "post"'],
    })
  })

  it('marks params the query expects to be null', () => {
    const inference = inferQueryParams(
      '*[(!defined($status) || status == $status) && $author != null && title == coalesce($title, "Untitled")]{"n": $limit}',
      WITH_SCHEMA,
    )
    expect(inference.params.map(({name, nullable}) => [name, nullable])).toEqual([
      ['status', true],
      ['author', true],
      ['title', true],
      ['limit', undefined],
    ])
    // The other alternatives of `coalesce` say what the param holds
    expect(inference.params[2].type).toEqual({kind: 'string', array: false})
  })

  it('reads `!$param || …` as an optional param, not a boolean', () => {
    const inference = inferQueryParams('*[(!$title || title == $title) && !$flag]', WITH_SCHEMA)
    expect(inference.params).toEqual([
      {
        name: 'title',
        node: {type: 'string'},
        type: {kind: 'string', array: false},
        usages: ['!$title', 'title == $title'],
        nullable: true,
      },
      {
        name: 'flag',
        node: {type: 'boolean'},
        type: {kind: 'boolean', array: false},
        usages: ['!$flag'],
      },
    ])
  })

  it('does not narrow a param to the literal it is compared with', () => {
    expect(typeOf('*[$type == "post"]', 'type')).toEqual({kind: 'string', array: false})
  })

  it('lists the params of a query that does not parse, without types', () => {
    const inference = inferQueryParams('*[_type == $type && title == $title', WITH_SCHEMA)
    expect(inference).toEqual({
      params: ['type', 'title'].map((name) => ({
        name,
        node: {type: 'unknown'},
        type: {kind: 'any', array: false},
        usages: [],
        reason: 'the query does not parse',
      })),
      syntaxError: true,
    })
  })
  it('lists the keys the query reads from an object param, each typed like a param', () => {
    const inference = inferQueryParams(
      '*[_type == "post" && count(tags) >= $range.min && count(tags) <= $range.max && rating > $range.limits.low && featured == $range.flag]',
      {schema, documentTypes},
    )
    const [range] = inference.params
    expect(range.name).toBe('range')
    expect(range.type).toEqual({kind: 'any', array: false})
    expect(range.fields?.map(({name, type}) => [name, type])).toEqual([
      ['min', {kind: 'integer', array: false, min: 0}],
      ['max', {kind: 'integer', array: false, min: 0}],
      ['limits', {kind: 'any', array: false}],
      ['flag', {kind: 'boolean', array: false}],
    ])
    const limits = range.fields?.[2]
    expect(limits?.fields).toEqual([
      {
        name: 'low',
        node: {type: 'unknown'},
        type: {kind: 'any', array: false},
        usages: ['rating > $range.limits.low'],
        reason: 'the schema does not type `rating`, which it is compared with',
      },
    ])
    expect(range.fields?.[0].usages).toEqual(['count(tags) >= $range.min'])
    // The exports print the object the query reads
    expect(range.node).toEqual({
      type: 'object',
      attributes: {
        min: {type: 'objectAttribute', value: {type: 'number'}},
        max: {type: 'objectAttribute', value: {type: 'number'}},
        limits: {
          type: 'objectAttribute',
          value: {
            type: 'object',
            attributes: {low: {type: 'objectAttribute', value: {type: 'unknown'}}},
          },
        },
        flag: {type: 'objectAttribute', value: {type: 'boolean'}},
      },
    })
  })

  it('reads the type of a key of an object param from the query alone', () => {
    const inference = inferQueryParams('*[_id == $doc.id && defined($doc.slug)]', {documentTypes})
    expect(inference.params[0].fields).toEqual([
      {
        name: 'id',
        node: {type: 'string'},
        type: {kind: 'string', array: false, format: 'document-id'},
        usages: ['_id == $doc.id'],
      },
      {
        name: 'slug',
        node: {type: 'unknown'},
        type: {kind: 'any', array: false},
        usages: ['defined($doc.slug)'],
        reason: 'the query only checks whether it is set',
        nullable: true,
      },
    ])
  })

  it('gives no keys to a param the query only reads whole', () => {
    expect(inferQueryParams('*[_type == $type]', {documentTypes}).params[0].fields).toBeUndefined()
  })
})
