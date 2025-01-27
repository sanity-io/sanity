import {type RouterState} from 'sanity/router'
import {describe, expect, it} from 'vitest'

import {type Tool} from '../../config/types'
import {resolveIntentState} from './helpers'

describe('resolveIntentState', () => {
  const testTool: Tool = {
    name: 'test',
    title: 'Test tool',
    component: () => null,
    canHandleIntent: () => true,
    getIntentState: () => ({}),
  }

  it('should resolve intent state with query params', () => {
    const state: RouterState = {
      intent: 'edit',
      params: {
        id: 'p-bay-area-san-francisco-2022-08-17-2022-08-17',
        type: 'playlist',
      },
      _searchParams: [['perspective', 'r123ABC']],
    }

    const resolved = resolveIntentState([testTool], null, state)
    expect(resolved).toEqual({
      type: 'state',
      isNotFound: false,
      state: {
        // searchParams are persisted in the router state
        _searchParams: [['perspective', 'r123ABC']],
        tool: 'test',
        test: {},
      },
    })
  })
})
