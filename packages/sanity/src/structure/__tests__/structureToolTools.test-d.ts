import {describe, expectTypeOf, test} from 'vitest'

import {structureTool} from '../structureTool'

describe('structureTool options', () => {
  test('still accepts its own options', () => {
    expectTypeOf(structureTool).toBeCallableWith({name: 'cars', title: 'Cars'})
    expectTypeOf(structureTool).toBeCallableWith()
  })

  test('no longer takes a per-instance header', () => {
    // @ts-expect-error `header` was replaced by the workspace-level `document.features`
    structureTool({header: {splitPane: {hidden: true}}})
  })

  test('does not take a per-instance tools list', () => {
    // @ts-expect-error tools are configured once per source, through `document.features`
    structureTool({tools: []})
  })
})
