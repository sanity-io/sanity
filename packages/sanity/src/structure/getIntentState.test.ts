import {beforeEach, describe, expect, it} from 'vitest'

import {getIntentState, setActivePanes} from './getIntentState'
import {type PaneNode} from './types'

describe('getIntentState', () => {
  beforeEach(() => setActivePanes([]))

  it('preserves the `path` param when an open documentList pane handles an edit intent', () => {
    // An active documentList pane that can resolve the edit intent for type "post".
    setActivePanes([
      {
        type: 'documentList',
        schemaTypeName: 'post',
        options: {filter: '_type == $type'},
      } as unknown as PaneNode,
    ])

    const result = getIntentState(
      'edit',
      {id: 'doc1', type: 'post', path: 'body[_key=="abc"].title'},
      {panes: []},
      undefined,
    )

    expect('panes' in result).toBe(true)
    if ('panes' in result) {
      const lastGroup = result.panes[result.panes.length - 1] as Array<{
        params?: Record<string, string>
      }>
      expect(lastGroup[0].params?.path).toBe('body[_key=="abc"].title')
    }
  })

  it('falls back to intent resolution when no open pane can handle it', () => {
    const result = getIntentState('edit', {id: 'doc1', type: 'post'}, {panes: []}, undefined)
    expect(result).toEqual({intent: 'edit', params: {id: 'doc1', type: 'post'}, payload: undefined})
  })
})
