import {describe, expect, it} from 'vitest'

import {ComponentBuilder} from '../Component'

function TestComponent() {
  return null
}

describe('ComponentBuilder', () => {
  describe('pane widths', () => {
    it('sets, gets, and serializes pane width constraints', () => {
      const builder = new ComponentBuilder({
        id: 'custom-pane',
        component: TestComponent,
      })
        .minWidth(320)
        .currentMaxWidth(350)
        .maxWidth(640)

      expect(builder.getMinWidth()).toBe(320)
      expect(builder.getCurrentMaxWidth()).toBe(350)
      expect(builder.getMaxWidth()).toBe(640)
      expect(builder.serialize()).toMatchObject({
        minWidth: 320,
        currentMaxWidth: 350,
        maxWidth: 640,
      })
    })
  })
})
