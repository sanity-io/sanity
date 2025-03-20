import {assertType, describe, test} from 'vitest'

import {presentationTool} from '../plugin'

describe('presentationTool()', () => {
  type PresentationToolPluginType = ReturnType<typeof presentationTool>

  describe('previewUrl', () => {
    test('can be a string', () => {
      assertType<PresentationToolPluginType>(
        presentationTool({
          previewUrl: '/preview',
        }),
      )
    })
    test('can be an URL instance', () => {
      assertType<PresentationToolPluginType>(
        presentationTool({
          previewUrl: new URL('/preview', 'http://localhost:3000'),
        }),
      )
    })
    test('is required', () => {
      // @ts-expect-error previewUrl is required
      assertType<PresentationToolPluginType>(presentationTool({}))
    })
  })
})
