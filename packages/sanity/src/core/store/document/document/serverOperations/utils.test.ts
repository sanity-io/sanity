import {describe, expect, it} from 'vitest'

import {createSnapshot} from '../__tests__/operationTestUtils'
import {isDraftDocument, isPublishedDocument} from './utils'

describe('server operation utils', () => {
  it('identifies published documents', () => {
    expect(isPublishedDocument(createSnapshot({_id: 'example-id'}))).toBe(true)
    expect(isPublishedDocument(createSnapshot({_id: 'drafts.example-id'}))).toBe(false)
    expect(isPublishedDocument(createSnapshot({_id: 'versions.release-id.example-id'}))).toBe(false)
  })

  it('identifies draft and version documents', () => {
    expect(isDraftDocument(createSnapshot({_id: 'drafts.example-id'}))).toBe(true)
    expect(isDraftDocument(createSnapshot({_id: 'versions.release-id.example-id'}))).toBe(true)
    expect(isDraftDocument(createSnapshot({_id: 'example-id'}))).toBe(false)
  })
})
