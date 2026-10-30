import {describe, expect, it} from 'vitest'

import {applyResolvedIntent, createResolvingPanes, getResolvingRequest} from '../resolvingPane'

describe('createResolvingPanes', () => {
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

describe('applyResolvedIntent', () => {
  it('does not bring back a focus mode the resolving pane already applied', () => {
    expect(
      applyResolvedIntent([[{id: '__resolve__abc', params: {type: 'book'}}]], '__resolve__abc', [
        [{id: 'books'}],
        [{id: 'abc', params: {mode: 'focus'}}],
      ]),
    ).toEqual([[{id: 'books'}], [{id: 'abc', params: undefined, payload: undefined}]])
  })

  it('rewrites every split sibling, keeping the params the user set while resolving', () => {
    expect(
      applyResolvedIntent(
        [
          [
            {id: '__resolve__abc', params: {type: 'book', intent: 'create', view: 'editor'}},
            {id: '__resolve__abc', params: {type: 'book', view: 'preview', inspect: 'history'}},
          ],
        ],
        '__resolve__abc',
        [[{id: 'books'}], [{id: 'abc', params: {template: 'book'}}]],
      ),
    ).toEqual([
      [{id: 'books'}],
      [
        {id: 'abc', params: {template: 'book', view: 'editor'}, payload: undefined},
        {
          id: 'abc',
          params: {template: 'book', view: 'preview', inspect: 'history'},
          payload: undefined,
        },
      ],
    ])
  })

  it('keeps the groups opened to the right of the resolving pane', () => {
    expect(
      applyResolvedIntent(
        [[{id: '__resolve__abc', params: {type: 'book'}}], [{id: 'author-1', params: {}}]],
        '__resolve__abc',
        [[{id: 'books'}], [{id: 'abc', params: {}}]],
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
})
