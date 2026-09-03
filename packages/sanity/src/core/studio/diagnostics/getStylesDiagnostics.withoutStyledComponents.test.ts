import {describe, expect, it, vi} from 'vitest'

import {getStylesDiagnostics} from './getStylesDiagnostics'

vi.mock('styled-components', () => ({version: undefined}))

describe('getStylesDiagnostics without a styled-components runtime', () => {
  it('reports no version and no nodes instead of failing', () => {
    expect(getStylesDiagnostics()).toEqual({
      styledComponents: {styleNodes: [], version: undefined},
    })
  })
})
