import {describe, expect, it} from 'vitest'

import {
  collectQuerySyncTagCandidates,
  flattenTraceValues,
  MAX_SYNC_TAG_TRACE_VALUES,
  MAX_SYNC_TAG_TRACES,
  type SyncTagTrace,
} from './syncTagQueryCandidates'

/** A trace query over a list expression, as the collector writes them */
function traceQuery(list: string): string {
  return `array::unique(array::compact(${list}))[0...${MAX_SYNC_TAG_TRACE_VALUES}]`
}

function trace(kind: SyncTagTrace['kind'], list: string): SyncTagTrace {
  return {kind, query: traceQuery(list)}
}

/** What an id trace lists for a reference: its target, with its dataset in front when it has one */
function target(reference: string): string {
  return `global::coalesce(${reference}._dataset + ":" + ${reference}._ref, ${reference}._ref)`
}

/**
 * The two traces of a dereference: the documents it reaches, with the trace of the references
 * that reach none beside it, and their types
 */
function deref(reference: string, wrap: (value: string) => string): SyncTagTrace[] {
  return [
    {
      kind: 'id',
      query: traceQuery(wrap(target(reference))),
      missingQuery: traceQuery(
        wrap(`select(!global::defined(${reference}->._id) => ${target(reference)})`),
      ),
    },
    trace('type', wrap(`${reference}->._type`)),
  ]
}

describe('collectQuerySyncTagCandidates', () => {
  describe('values the query writes out', () => {
    it('collects the ids, types and slugs compared with literals and params', () => {
      expect(
        collectQuerySyncTagCandidates(
          '*[_type == "book" && _id == $id && slug.current == "about" && "x" == _id]',
          {id: 'book-1'},
        ),
      ).toEqual({
        ids: ['book-1', 'x'],
        types: ['book'],
        slugs: ['about'],
        traces: [],
        sliced: false,
      })
    })

    it('collects each value of an `in` list, written out or given as a param', () => {
      const {ids, types} = collectQuerySyncTagCandidates(
        '*[_type in ["a", $b, "c"] && _id in $ids]',
        {b: 'b', ids: ['x', 42, '', 'y']},
      )
      expect(types).toEqual(['a', 'b', 'c'])
      expect(ids).toEqual(['x', 'y'])
    })

    it('takes a slug path under any plain attribute chain, but not under an array', () => {
      const {slugs, traces} = collectQuerySyncTagCandidates(
        '*[seo.slug.current == "a" || slugs[].current == "b" || author->slug.current == "c"]',
      )
      expect(slugs).toEqual(['a'])
      // The dereference is traced, the other comparisons are no tag of their own
      expect(traces).toHaveLength(2)
    })

    it('ignores comparisons that no tag of a single document stands for', () => {
      expect(
        collectQuerySyncTagCandidates(
          '*[_id in path("drafts.**") && _type != "a" && title == "x" && _id match "b*" && references("c")]',
        ),
      ).toEqual({ids: [], types: [], slugs: [], traces: [], sliced: false})
    })

    it('reads a param a slice bound needs to parse', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a"][$from...$to]', {from: 0, to: 2}).types,
      ).toEqual(['a'])
    })

    it('has no candidates for a query that does not parse', () => {
      expect(collectQuerySyncTagCandidates('*[_type == "a"')).toEqual({
        ids: [],
        types: [],
        slugs: [],
        traces: [],
        sliced: false,
      })
    })

    it('tells a query that slices or indexes what it filters from one that reads it all', () => {
      const sliced = (query: string) => collectQuerySyncTagCandidates(query).sliced
      expect(sliced('*[_type == "a"][0...2]')).toBe(true)
      expect(sliced('*[_type == "a"][0]')).toBe(true)
      expect(sliced('(*[_type == "a"])[1..3]{_id}')).toBe(true)
      expect(sliced('*[_type == "a"]')).toBe(false)
      // Ordering reads every document before the slice takes the first of them
      expect(sliced('*[_type == "a"] | order(_createdAt)[0...2]')).toBe(false)
      expect(sliced('*[_type == "a"] | order(_createdAt)[0]')).toBe(false)
    })
  })

  describe('traces of computed comparisons', () => {
    it('traces a function of a param', () => {
      expect(collectQuerySyncTagCandidates('*[_id == lower($id)]', {id: 'A'}).traces).toEqual([
        trace('id', '[global::lower($id)]'),
      ])
    })

    it('traces a parent’s field compared in a subquery, once per parent', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a"]{"r": *[_id == ^.author._ref][0]{_id}}')
          .traces,
      ).toEqual([trace('id', '*[_type == "a"]{"v": @.author._ref}.v')])
    })

    it('traces a type compared with a parent’s field', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a"]{"r": *[_type == ^.kind]}').traces,
      ).toEqual([trace('type', '*[_type == "a"]{"v": @.kind}.v')])
    })

    it('traces a subquery an `in` compares with, and the splat of a list', () => {
      expect(
        collectQuerySyncTagCandidates('*[_id in *[_type == "a"][0...2]._id || _id in [...$ids]]', {
          ids: ['x'],
        }).traces,
      ).toEqual([trace('id', '*[_type == "a"][0...2]._id'), trace('id', '$ids')])
    })
  })

  describe('traces of dereferences', () => {
    it('traces the references a projection dereferences', () => {
      expect(collectQuerySyncTagCandidates('*[_type == "a"]{"n": author->name}').traces).toEqual(
        deref('author', (value) => `*[_type == "a"]{"v": ${value}}.v`),
      )
    })

    it('flattens the references of an array dereference, at each depth', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a"]{types[]->{_id, "g": generation->_id}}')
          .traces,
      ).toEqual([
        ...deref('@', (value) => `*[_type == "a"]{"v": types[]{"v": ${value}}.v}.v[]`),
        ...deref(
          'generation',
          (value) => `*[_type == "a"]{"v": types[]{"v": @->{"v": ${value}}.v}.v}.v[]`,
        ),
      ])
    })

    it('traces a dereference in a filter among the documents the conjuncts before it keep', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a" && author->name == "x" && published]').traces,
      ).toEqual(deref('author', (value) => `*[_type == "a"]{"v": ${value}}.v`))
    })

    it('traces a dereference in `order()`, `count()` and a single element', () => {
      expect(
        collectQuerySyncTagCandidates('*[_type == "a"] | order(author->name)[0...2]').traces,
      ).toEqual(deref('author', (value) => `*[_type == "a"]{"v": ${value}}.v`))
      expect(collectQuerySyncTagCandidates('count(*[defined(author->_id)])').traces).toEqual(
        deref('author', (value) => `*{"v": ${value}}.v`),
      )
      expect(collectQuerySyncTagCandidates('*[_type == "a"][0].author->_id').traces).toEqual(
        deref('*[_type == "a"][0].author', (value) => `[${value}]`),
      )
    })

    it('reaches a parent scope from inside a dereferenced document', () => {
      expect(
        collectQuerySyncTagCandidates(
          '*[_type == "a"]{"r": author->{"back": *[_id == ^.^.editor._ref]}}',
        ).traces,
      ).toEqual([
        ...deref('author', (value) => `*[_type == "a"]{"v": ${value}}.v`),
        trace('id', '*[_type == "a"]{"v": @.editor._ref}.v'),
      ])
    })

    it('traces each expression once, and at most the named number of them', () => {
      const fields = Array.from(
        {length: MAX_SYNC_TAG_TRACES + 3},
        (_, index) => `"f${index}": f${index}->_id`,
      )
      const {traces} = collectQuerySyncTagCandidates(
        `*[_type == "a"]{${fields.join(', ')}, "again": f0->_id}`,
      )
      expect(traces).toHaveLength(MAX_SYNC_TAG_TRACES)
      expect(new Set(traces.map((item) => item.query)).size).toBe(traces.length)
    })
  })
})

describe('flattenTraceValues', () => {
  it('lists the strings of a result, nested arrays included, and nothing else', () => {
    expect(flattenTraceValues(['a', ['b', ['c', 1, null]], '', {d: 'd'}])).toEqual(['a', 'b', 'c'])
    expect(flattenTraceValues(null)).toEqual([])
  })
})
