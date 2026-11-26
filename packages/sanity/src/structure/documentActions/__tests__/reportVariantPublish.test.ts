import {Subject} from 'rxjs'
import {type IdPair, type OperationError, type OperationSuccess} from 'sanity'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {reportVariantPublish} from '../reportVariantPublish'

type OperationEvent = OperationSuccess | OperationError

const idPair: IdPair = {
  publishedId: 'article-1',
  draftId: 'drafts.article-1',
  versionId: 'versions.scope.article-1',
}

const success = (op: OperationEvent['op']): OperationEvent => ({
  type: 'success',
  op,
  id: 'article-1',
  idPair,
})

const failure = (op: OperationEvent['op']): OperationEvent => ({
  type: 'error',
  op,
  id: 'article-1',
  idPair,
  error: new Error('publish failed'),
})

describe('reportVariantPublish', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports once when the next publish succeeds, ignoring other operations', () => {
    const events$ = new Subject<OperationEvent>()
    const onPublished = vi.fn()

    reportVariantPublish('article:article-1', events$, onPublished)
    events$.next(success('commit'))
    expect(onPublished).not.toHaveBeenCalled()

    events$.next(success('publish'))
    events$.next(success('publish'))
    expect(onPublished).toHaveBeenCalledTimes(1)
    expect(events$.observed).toBe(false)
  })

  it('does not report a publish that fails', () => {
    const events$ = new Subject<OperationEvent>()
    const onPublished = vi.fn()

    reportVariantPublish('article:article-1', events$, onPublished)
    events$.next(failure('publish'))
    events$.next(success('publish'))

    expect(onPublished).not.toHaveBeenCalled()
  })

  it('replaces a pending report for the same document, so a cancelled publish is not counted twice', () => {
    const events$ = new Subject<OperationEvent>()
    const first = vi.fn()
    const second = vi.fn()

    reportVariantPublish('article:article-1', events$, first)
    reportVariantPublish('article:article-1', events$, second)
    events$.next(success('publish'))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('keeps reports for different documents apart', () => {
    const articleEvents$ = new Subject<OperationEvent>()
    const authorEvents$ = new Subject<OperationEvent>()
    const onArticlePublished = vi.fn()
    const onAuthorPublished = vi.fn()

    reportVariantPublish('article:article-1', articleEvents$, onArticlePublished)
    reportVariantPublish('author:author-1', authorEvents$, onAuthorPublished)
    articleEvents$.next(success('publish'))
    authorEvents$.next(success('publish'))

    expect(onArticlePublished).toHaveBeenCalledTimes(1)
    expect(onAuthorPublished).toHaveBeenCalledTimes(1)
  })

  it('stops waiting when no publish result arrives in time', () => {
    vi.useFakeTimers()
    const events$ = new Subject<OperationEvent>()
    const onPublished = vi.fn()

    reportVariantPublish('article:article-1', events$, onPublished)
    vi.advanceTimersByTime(60_000)

    expect(events$.observed).toBe(false)
    events$.next(success('publish'))
    expect(onPublished).not.toHaveBeenCalled()
  })
})
