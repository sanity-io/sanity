import {act, renderHook} from '@testing-library/react'
import {type MutableRefObject} from 'react'
import {describe, expect, it} from 'vitest'

import {type FrameState} from '../types'
import {type DocumentOnPage, useDocumentsOnPage} from '../useDocumentsOnPage'

function createFrameStateRef(url: string): MutableRefObject<FrameState> {
  return {current: {url} as FrameState}
}

function documentsFor(ids: string[]): DocumentOnPage[] {
  return ids.map((id) => ({_id: id, _type: 'page'}))
}

describe('useDocumentsOnPage', () => {
  it('returns an empty visual order when the visual-editing key is empty while other keys populate membership', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('preview-kit', 'drafts', documentsFor(['drafts.a', 'drafts.b']))
    })

    const [documentsOnPage, , visualOrderPublishedIds] = result.current
    expect(visualOrderPublishedIds).toEqual([])
    expect(documentsOnPage.map((doc) => doc._id)).toEqual(['drafts.a', 'drafts.b'])
  })

  it('reflects the visual-editing order regardless of which key was populated first', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('preview-kit', 'drafts', documentsFor(['a', 'b', 'c']))
    })
    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('visual-editing', 'drafts', documentsFor(['c', 'a', 'b']))
    })

    expect(result.current[2]).toEqual(['c', 'a', 'b'])
  })

  it('reflects the visual-editing order when visual-editing is populated before preview-kit', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('visual-editing', 'drafts', documentsFor(['c', 'a', 'b']))
    })
    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('preview-kit', 'drafts', documentsFor(['a', 'b', 'c']))
    })

    expect(result.current[2]).toEqual(['c', 'a', 'b'])
  })

  it('normalises draft and version id forms in the visual cache and dedupes them', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage(
        'visual-editing',
        'drafts',
        documentsFor(['drafts.x', 'versions.r.y', 'x']),
      )
    })

    expect(result.current[2]).toEqual(['x', 'y'])
  })

  it('drops the prior visual order when the frame url changes', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('visual-editing', 'drafts', documentsFor(['a', 'b']))
    })
    expect(result.current[2]).toEqual(['a', 'b'])

    act(() => {
      frameStateRef.current = {url: 'https://example.com/b'} as FrameState
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('preview-kit', 'drafts', documentsFor(['c']))
    })

    expect(result.current[2]).toEqual([])
  })

  it('keeps the flat membership array as the union across keys', () => {
    const frameStateRef = createFrameStateRef('https://example.com/a')
    const {result} = renderHook(() => useDocumentsOnPage('drafts', frameStateRef))

    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('preview-kit', 'drafts', documentsFor(['a', 'b']))
    })
    act(() => {
      const setDocumentsOnPage = result.current[1]
      setDocumentsOnPage('visual-editing', 'drafts', documentsFor(['c', 'a']))
    })

    expect(result.current[0].map((doc) => doc._id).sort()).toEqual(['a', 'b', 'c'])
  })
})
