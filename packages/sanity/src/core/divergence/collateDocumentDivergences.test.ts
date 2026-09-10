import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  type CollatedDocumentDivergencesState,
  collateDocumentDivergences,
  peekCollatedDocumentDivergences,
} from './collateDocumentDivergences'

// Production debounce is 1s; Vitest 5's expect.poll default timeout is also 1s and
// fails hard when the deadline elapses (unlike Vitest 4). Give the poll room past
// debounce + computation so the first attempt does not flake into retries.
const READY_POLL_TIMEOUT_MS = 2_500

describe('collateDocumentDivergences', () => {
  it('collates document divergences when context is written', async () => {
    const upstreamAtFork: SanityDocument = {
      _id: 'a',
      _type: 'article',
      _rev: 'revA',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'alpha',
    }

    const upstreamHead: SanityDocument = {
      _id: 'a',
      _type: 'article',
      _rev: 'revB',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'beta',
    }

    const subjectHead: SanityDocument = {
      _id: 'drafts.a',
      _type: 'article',
      _rev: 'revC',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'alpha',
    }

    const {context, observable} = collateDocumentDivergences({
      upstreamId: upstreamHead._id,
      subjectId: subjectHead._id,
    })

    const emissions: CollatedDocumentDivergencesState[] = []
    observable.subscribe((emission) => emissions.push(emission))

    context.next({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    })

    await expect.poll(() => emissions.at(-1)?.state, {timeout: READY_POLL_TIMEOUT_MS}).toBe('ready')

    expect(emissions.at(0)?.state).toBe('pending')
    expect(emissions.at(-1)?.state).toBe('ready')
  })
})

describe('peekCollatedDocumentDivergences', () => {
  it('emits collated divergences once available', async () => {
    const upstreamAtFork: SanityDocument = {
      _id: 'b',
      _type: 'article',
      _rev: 'revA',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'alpha',
    }

    const upstreamHead: SanityDocument = {
      _id: 'b',
      _type: 'article',
      _rev: 'revB',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'beta',
    }

    const subjectHead: SanityDocument = {
      _id: 'drafts.b',
      _type: 'article',
      _rev: 'revC',
      _createdAt: '2025-10-29T09:00:00Z',
      _updatedAt: '2025-10-29T09:10:00Z',
      alpha: 'alpha',
    }

    const {context} = collateDocumentDivergences({
      upstreamId: upstreamHead._id,
      subjectId: subjectHead._id,
    })

    const peek = peekCollatedDocumentDivergences({
      upstreamId: 'b',
      subjectId: 'drafts.b',
    })

    const emissions: CollatedDocumentDivergencesState[] = []
    peek.subscribe((emission) => emissions.push(emission))

    context.next({
      upstreamAtFork,
      upstreamHead,
      subjectHead,
    })

    await expect.poll(() => emissions.at(-1)?.state, {timeout: READY_POLL_TIMEOUT_MS}).toBe('ready')

    expect(emissions.at(0)?.state).toBe('pending')
    expect(emissions.at(-1)?.state).toBe('ready')
  })
})
