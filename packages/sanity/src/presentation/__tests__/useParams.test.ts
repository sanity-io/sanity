import {act, renderHook} from '@testing-library/react'
import {type RouterState, type SearchParam} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'

import {type PresentationNavigateOptions} from '../types'
import {useParams} from '../useParams'

const routerState = {
  id: 'book-1',
  type: 'book',
  _searchParams: [
    ['perspective', 'drafts'],
    ['preview', '/index'],
    ['viewport', 'mobile'],
    ['changesInspectorTab', 'review'],
    ['comment', 'comment-1'],
    ['unrecognised', 'dropped'],
  ] satisfies SearchParam[],
}

function navigate(options: PresentationNavigateOptions): SearchParam[] {
  const routerNavigate = vi.fn()

  const {result} = renderHook(() =>
    useParams({
      initialPreviewUrl: new URL('https://example.com'),
      routerNavigate,
      routerState,
      routerSearchParams: Object.fromEntries(routerState._searchParams),
      frameStateRef: {current: {title: undefined, url: undefined}},
    }),
  )

  act(() => result.current.navigate(options))

  const [nextRouterState] = routerNavigate.mock.calls[0] as [RouterState]
  return nextRouterState._searchParams ?? []
}

function definedParams(searchParams: SearchParam[]): Record<string, string> {
  return Object.fromEntries(searchParams.filter(([, value]) => value !== undefined))
}

describe('useParams', () => {
  it('maintains presentation and document pane params when the document is unchanged', () => {
    const searchParams = navigate({state: {id: 'book-1', type: 'book'}})

    expect(definedParams(searchParams)).toEqual({
      perspective: 'drafts',
      preview: '/index',
      viewport: 'mobile',
      changesInspectorTab: 'review',
      comment: 'comment-1',
    })
  })

  it('drops document pane params when navigating to another document', () => {
    const searchParams = navigate({state: {id: 'book-2', type: 'book'}})

    expect(definedParams(searchParams)).toEqual({
      perspective: 'drafts',
      preview: '/index',
      viewport: 'mobile',
    })
  })

  it('lets explicit params override the maintained ones', () => {
    const searchParams = navigate({
      state: {id: 'book-1', type: 'book'},
      params: {changesInspectorTab: 'history', viewport: 'desktop'},
    })

    expect(definedParams(searchParams)).toMatchObject({
      changesInspectorTab: 'history',
      viewport: 'desktop',
    })
  })

  it('records maintained keys with no current value as undefined', () => {
    const searchParams = navigate({state: {id: 'book-1', type: 'book'}})

    expect(searchParams).toContainEqual(['inspect', undefined])
  })
})
