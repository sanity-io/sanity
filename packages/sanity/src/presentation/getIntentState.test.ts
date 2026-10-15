import {encodeJsonParams} from 'sanity/router'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {getIntentState} from './getIntentState'

vi.mock('@sanity/uuid', () => ({
  uuid: () => 'generated-document-id',
}))

const originalHref = window.location.href

function presentationSearchParams(result: ReturnType<typeof getIntentState>) {
  return '_searchParams' in result ? Object.fromEntries(result._searchParams) : undefined
}

describe('getIntentState', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    window.history.replaceState({}, '', originalHref)
    vi.restoreAllMocks()
  })

  test('maps an edit intent to the published id and defaults type and preview', () => {
    const result = getIntentState('edit', {id: 'drafts.doc-1'}, undefined, undefined)

    expect(result).toEqual({
      type: '*',
      id: 'doc-1',
      path: undefined,
      _searchParams: [['preview', '/']],
    })
  })

  test('strips a release version prefix from an edit id', () => {
    const result = getIntentState(
      'edit',
      {id: 'versions.summer-drop.doc-1', type: 'post'},
      undefined,
      undefined,
    )

    expect(result).toMatchObject({type: 'post', id: 'doc-1'})
  })

  test('prefers the intent preview over a sticky router preview and the location search', () => {
    window.history.replaceState({}, '', '/?preview=/from-location')

    const result = getIntentState(
      'edit',
      {id: 'doc-1', type: 'post', preview: '/from-intent'},
      {
        _searchParams: [
          ['preview', '/from-router'],
          ['viewport', 'desktop'],
        ],
      },
      undefined,
    )

    expect(presentationSearchParams(result)).toEqual({
      preview: '/from-intent',
      viewport: 'desktop',
    })
  })

  test('keeps sticky viewport and drops other router search params', () => {
    const result = getIntentState(
      'edit',
      {id: 'doc-1', type: 'post'},
      {
        _searchParams: [
          ['viewport', 'tablet'],
          ['perspective', 'drafts'],
          ['preview', '/from-router'],
        ],
      },
      undefined,
    )

    expect(presentationSearchParams(result)).toEqual({
      viewport: 'tablet',
      preview: '/from-router',
    })
  })

  test('forwards path and extra intent params, omitting mode and presentation', () => {
    const result = getIntentState(
      'edit',
      {
        id: 'doc-1',
        type: 'post',
        path: 'body[_key=="abc"].title',
        mode: 'visual',
        presentation: 'presentation',
        inspect: 'sanity',
      },
      undefined,
      undefined,
    )

    expect(result).toMatchObject({
      type: 'post',
      id: 'doc-1',
      path: 'body[_key=="abc"].title',
    })
    expect(presentationSearchParams(result)).toEqual({
      preview: '/',
      inspect: 'sanity',
    })
  })

  test('falls back to the location preview when neither intent nor router supplies one', () => {
    window.history.replaceState({}, '', '/?preview=/from-location')

    const result = getIntentState('edit', {id: 'doc-1', type: 'post'}, undefined, undefined)

    expect(presentationSearchParams(result)).toEqual({preview: '/from-location'})
  })

  test('leaves an edit intent without an id for later resolution', () => {
    expect(getIntentState('edit', {type: 'post'}, undefined, undefined)).toEqual({
      intent: 'edit',
      params: {type: 'post'},
      payload: undefined,
    })
  })

  test('assigns a generated id and encodes an object payload on create', () => {
    const payload = {parentId: 'page-1'}
    const result = getIntentState(
      'create',
      {type: 'page', template: 'page-with-parent'},
      undefined,
      payload,
    )

    expect(result).toMatchObject({
      type: 'page',
      id: 'generated-document-id',
    })
    expect(presentationSearchParams(result)).toEqual({
      preview: '/',
      template: 'page-with-parent',
      templateParams: encodeJsonParams(payload),
    })
  })

  test('uses a supplied create id and does not encode a missing payload', () => {
    const result = getIntentState('create', {id: 'new-doc', type: 'page'}, undefined, undefined)

    expect(result).toEqual({
      type: 'page',
      id: 'new-doc',
      _searchParams: [['preview', '/']],
    })
  })

  test('does not encode a null create payload', () => {
    const result = getIntentState('create', {id: 'new-doc', type: 'page'}, undefined, null)

    expect(presentationSearchParams(result)).toEqual({preview: '/'})
  })

  test('falls back from location preview to slash on create', () => {
    window.history.replaceState({}, '', '/?preview=/from-location')

    const withLocation = getIntentState(
      'create',
      {id: 'new-doc', type: 'page'},
      undefined,
      undefined,
    )
    expect(presentationSearchParams(withLocation)).toEqual({preview: '/from-location'})

    window.history.replaceState({}, '', '/')
    const withoutLocation = getIntentState(
      'create',
      {id: 'new-doc', type: 'page'},
      undefined,
      undefined,
    )
    expect(presentationSearchParams(withoutLocation)).toEqual({preview: '/'})
  })

  test('passes unknown intents through unchanged', () => {
    const params = {id: 'doc-1', type: 'post'}
    const payload = {foo: 'bar'}

    expect(getIntentState('duplicate', params, undefined, payload)).toEqual({
      intent: 'duplicate',
      params,
      payload,
    })
  })
})
