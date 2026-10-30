import {describe, expect, it} from 'vitest'

import {type RouterPanes} from '../../types'
import {
  applyResolvedIntent,
  createResolvingPanes,
  getDocumentIdFromPaneId,
  getResolvingRequest,
  isFallbackEditorPaneId,
  isResolvingPaneId,
} from '../resolvingPane'

describe('resolving pane ids', () => {
  it('recognizes the resolving and fallback editor prefixes', () => {
    expect(isResolvingPaneId('__resolve__abc')).toBe(true)
    expect(isResolvingPaneId('__edit__abc')).toBe(false)
    expect(isFallbackEditorPaneId('__resolve__abc')).toBe(true)
    expect(isFallbackEditorPaneId('__edit__abc')).toBe(true)
    expect(isFallbackEditorPaneId('abc')).toBe(false)
  })

  it('strips either prefix from the document id', () => {
    expect(getDocumentIdFromPaneId('__resolve__abc')).toBe('abc')
    expect(getDocumentIdFromPaneId('__edit__abc')).toBe('abc')
    expect(getDocumentIdFromPaneId('abc')).toBe('abc')
  })
})

describe('createResolvingPanes', () => {
  it('opens the document of an edit intent in a resolving pane', () => {
    expect(
      createResolvingPanes({intent: 'edit', params: {id: 'abc', type: 'book'}, payload: undefined}),
    ).toEqual([[{id: '__resolve__abc', params: {type: 'book'}, payload: undefined}]])
  })

  it('keeps the intent, template and payload of a create intent', () => {
    const panes = createResolvingPanes({
      intent: 'create',
      params: {id: 'abc', type: 'book', template: 'book-by-author'},
      payload: {authorId: 'grrm'},
    })

    expect(panes).toEqual([
      [
        {
          id: '__resolve__abc',
          params: {type: 'book', template: 'book-by-author', intent: 'create'},
          payload: {authorId: 'grrm'},
        },
      ],
    ])
    expect(getResolvingRequest(panes)).toEqual({
      intent: 'create',
      params: {id: 'abc', type: 'book', template: 'book-by-author'},
      payload: {authorId: 'grrm'},
    })
  })
})

describe('getResolvingRequest', () => {
  it('rebuilds the edit intent of a resolving pane', () => {
    expect(
      getResolvingRequest([[{id: '__resolve__abc', params: {type: 'book', view: 'preview'}}]]),
    ).toEqual({
      intent: 'edit',
      params: {id: 'abc', type: 'book', view: 'preview'},
      payload: undefined,
    })
  })

  it('ignores panes that are not resolving', () => {
    expect(getResolvingRequest(undefined)).toBeUndefined()
    expect(getResolvingRequest([])).toBeUndefined()
    expect(getResolvingRequest([[{id: 'books'}]])).toBeUndefined()
    expect(getResolvingRequest([[{id: '__edit__abc', params: {type: 'book'}}]])).toBeUndefined()
  })

  it('ignores a resolving pane without a type', () => {
    expect(getResolvingRequest([[{id: '__resolve__abc'}]])).toBeUndefined()
  })
})

describe('applyResolvedIntent', () => {
  const resolvedPanes: RouterPanes = [[{id: 'books'}], [{id: 'abc', params: {}}]]

  it('replaces the resolving pane with the resolved path', () => {
    expect(
      applyResolvedIntent(
        [[{id: '__resolve__abc', params: {type: 'book'}}]],
        '__resolve__abc',
        resolvedPanes,
      ),
    ).toEqual([[{id: 'books'}], [{id: 'abc', params: undefined, payload: undefined}]])
  })

  it('carries over the params the user set while the intent was resolving', () => {
    expect(
      applyResolvedIntent(
        [
          [
            {
              id: '__resolve__abc',
              params: {type: 'book', intent: 'create', view: 'preview', inspect: 'history'},
            },
          ],
        ],
        '__resolve__abc',
        [[{id: 'books'}], [{id: 'abc', params: {template: 'book'}}]],
      ),
    ).toEqual([
      [{id: 'books'}],
      [
        {
          id: 'abc',
          params: {template: 'book', view: 'preview', inspect: 'history'},
          payload: undefined,
        },
      ],
    ])
  })

  it('rewrites every split sibling of the resolving pane', () => {
    expect(
      applyResolvedIntent(
        [
          [
            {id: '__resolve__abc', params: {type: 'book', view: 'editor', expanded: 'true'}},
            {id: '__resolve__abc', params: {type: 'book', view: 'preview'}},
          ],
        ],
        '__resolve__abc',
        resolvedPanes,
      ),
    ).toEqual([
      [{id: 'books'}],
      [
        {id: 'abc', params: {view: 'editor', expanded: 'true'}, payload: undefined},
        {id: 'abc', params: {view: 'preview'}, payload: undefined},
      ],
    ])
  })

  it('keeps the groups opened to the right of the resolving pane', () => {
    expect(
      applyResolvedIntent(
        [[{id: '__resolve__abc', params: {type: 'book'}}], [{id: 'author-1', params: {}}]],
        '__resolve__abc',
        resolvedPanes,
      ),
    ).toEqual([
      [{id: 'books'}],
      [{id: 'abc', params: undefined, payload: undefined}],
      [{id: 'author-1', params: {}}],
    ])
  })

  it('keeps the type of the fallback editor', () => {
    expect(
      applyResolvedIntent(
        [[{id: '__resolve__abc', params: {type: 'book', view: 'preview'}}]],
        '__resolve__abc',
        [[{id: '__edit__abc', params: {type: 'book'}, payload: {title: 'Dune'}}]],
      ),
    ).toEqual([
      [{id: '__edit__abc', params: {type: 'book', view: 'preview'}, payload: {title: 'Dune'}}],
    ])
  })

  it('changes nothing when the user navigated away from the resolving pane', () => {
    expect(applyResolvedIntent([[{id: 'authors'}]], '__resolve__abc', resolvedPanes)).toBe(
      undefined,
    )
    expect(applyResolvedIntent([], '__resolve__abc', resolvedPanes)).toBeUndefined()
  })

  it('changes nothing without a resolved path', () => {
    expect(
      applyResolvedIntent([[{id: '__resolve__abc', params: {type: 'book'}}]], '__resolve__abc', []),
    ).toBeUndefined()
  })
})
