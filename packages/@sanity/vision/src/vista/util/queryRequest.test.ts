import {type SanityClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type QueryRequest} from '../store/types'
import {haveSameQuery} from './queryRequest'

function request(query: string, params: Record<string, unknown>): QueryRequest {
  return {client: {} as SanityClient, query, params, includeSourceMap: false, url: ''}
}

describe('haveSameQuery', () => {
  it('compares the query text and the params by value', () => {
    const a = request('*[_id == $id && _type == $type]', {id: 'a', type: 'post'})

    expect(haveSameQuery(a, request(a.query, {type: 'post', id: 'a'}))).toBe(true)
    expect(haveSameQuery(a, request(a.query, {id: 'a', type: 'page'}))).toBe(false)
    expect(haveSameQuery(a, request(a.query, {id: 'a'}))).toBe(false)
    expect(haveSameQuery(a, request('*[_id == $id]', a.params))).toBe(false)
  })

  it('ignores the request options', () => {
    const a = request('*', {})
    expect(haveSameQuery(a, {...a, includeSourceMap: true, url: 'https://elsewhere'})).toBe(true)
  })
})
