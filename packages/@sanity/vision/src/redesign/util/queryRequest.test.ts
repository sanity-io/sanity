import {createClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type QueryRequest} from '../store/types'
import {haveSameQuery} from './queryRequest'

const testClient = createClient({
  projectId: 'test',
  dataset: 'test',
  apiVersion: '2025-02-19',
  useCdn: false,
})

function request(query: string, params: Record<string, unknown>): QueryRequest {
  return {
    client: testClient,
    query,
    params,
    resultSourceMap: undefined,
    useCdn: false,
    url: '',
  }
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
    expect(haveSameQuery(a, {...a, resultSourceMap: true, url: 'https://elsewhere'})).toBe(true)
  })
})
