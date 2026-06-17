import {describe, expect, it} from 'vitest'

import {type ReferenceSearchSpec} from '../common/deriveReferenceSearchSpecs'
import {createReferenceResolveQuery} from './createReferenceResolveQuery'

describe('createReferenceResolveQuery', () => {
  it('returns undefined when there are no specs', () => {
    expect(createReferenceResolveQuery([], 'jane')).toBeUndefined()
  })

  it('builds an index-accelerated id-resolving query without dereferences', () => {
    const specs: ReferenceSearchSpec[] = [{targetType: 'author', leafPath: 'name', weight: 5}]

    const resolve = createReferenceResolveQuery(specs, 'jane')

    expect(resolve?.query).toBe(
      '*[(_type == "author" && name match text::query($__query))][0...1000]._id',
    )
    // The slice bound must be a literal: GROQ rejects a parameterised slice.
    expect(resolve?.query).not.toContain('$__refResolveLimit')
    // The slice must precede `._id`, else it binds to the string and yields nulls.
    expect(resolve?.query).not.toContain('._id[0...')
    expect(resolve?.query).not.toContain('->')
    expect(resolve?.params.__query).toBe('jane*')
  })

  it('ORs a clause per target/leaf and dedupes identical clauses', () => {
    const specs: ReferenceSearchSpec[] = [
      {targetType: 'author', leafPath: 'name', weight: 5},
      {targetType: 'organisation', leafPath: 'name', weight: 5},
      {targetType: 'author', leafPath: 'name', weight: 10},
    ]

    const resolve = createReferenceResolveQuery(specs, 'acme')

    expect(resolve?.query).toBe(
      '*[(_type == "author" && name match text::query($__query)) || (_type == "organisation" && name match text::query($__query))][0...1000]._id',
    )
  })

  it('wraps portable-text leaves in pt::text', () => {
    const specs: ReferenceSearchSpec[] = [
      {targetType: 'author', leafPath: 'bio', weight: 5, mapWith: 'pt::text'},
    ]

    const resolve = createReferenceResolveQuery(specs, 'jane')

    expect(resolve?.query).toContain('pt::text(bio) match text::query($__query)')
  })
})
