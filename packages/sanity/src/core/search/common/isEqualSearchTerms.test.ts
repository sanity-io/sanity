import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {isEqualSearchTerms} from './isEqualSearchTerms'
import {type SearchTerms} from './types'

function schemaType(name: string): SchemaType {
  // compiled schema types are cyclic: a reference field points back at the type itself
  const type = {name, jsonType: 'object', fields: [] as unknown[]} as unknown as SchemaType
  ;(type as unknown as {fields: unknown[]}).fields.push({name: 'self', type: {to: [{type}]}})
  return type
}

const author = schemaType('author')
const book = schemaType('book')

describe('isEqualSearchTerms', () => {
  it('returns true for the same reference', () => {
    const terms: SearchTerms = {query: 'a', types: [author]}
    expect(isEqualSearchTerms(terms, terms)).toBe(true)
  })

  it('compares schema types by name, not by instance', () => {
    const a: SearchTerms = {query: 'a', types: [author]}
    const b: SearchTerms = {query: 'a', types: [schemaType('author')]}
    expect(isEqualSearchTerms(a, b)).toBe(true)
  })

  it('does not walk cyclic schema types', () => {
    const a: SearchTerms = {query: 'a', types: [author, book]}
    const b: SearchTerms = {query: 'a', types: [schemaType('author'), schemaType('book')]}
    expect(() => isEqualSearchTerms(a, b)).not.toThrow()
    expect(isEqualSearchTerms(a, b)).toBe(true)
  })

  it('detects differing type names, order and count', () => {
    const base: SearchTerms = {query: 'a', types: [author, book]}
    expect(isEqualSearchTerms(base, {query: 'a', types: [author]})).toBe(false)
    expect(isEqualSearchTerms(base, {query: 'a', types: [book, author]})).toBe(false)
    expect(isEqualSearchTerms(base, {query: 'a', types: [author, schemaType('movie')]})).toBe(false)
  })

  it('compares the remaining term fields deeply', () => {
    const base: SearchTerms = {query: 'a', filter: 'x == 1', params: {x: 1}, types: [author]}
    expect(
      isEqualSearchTerms(base, {query: 'a', filter: 'x == 1', params: {x: 1}, types: [author]}),
    ).toBe(true)
    expect(isEqualSearchTerms(base, {...base, query: 'b'})).toBe(false)
    expect(isEqualSearchTerms(base, {...base, filter: 'x == 2'})).toBe(false)
    expect(isEqualSearchTerms(base, {...base, params: {x: 2}})).toBe(false)
  })

  it('includes recent search metadata in the comparison', () => {
    type RecentTerms = SearchTerms & {__recent: {index: number; timestamp: number}}
    const recent: RecentTerms = {query: 'a', types: [author], __recent: {index: 0, timestamp: 1}}
    const sameRecent: RecentTerms = {...recent, __recent: {index: 0, timestamp: 1}}
    const otherRecent: RecentTerms = {...recent, __recent: {index: 1, timestamp: 1}}
    expect(isEqualSearchTerms(recent, sameRecent)).toBe(true)
    expect(isEqualSearchTerms(recent, otherRecent)).toBe(false)
  })
})
