import {expect, test} from 'vitest'

import {LAYER_ORDER_STATEMENT, layerOrderPlugin} from '../layerOrder.ts'

test("the statement declares ui5's `sui` and nothing else", () => {
  // Only `sui` is still ordered: the studio's CSS is unlayered, and @sanity/ui v4 declares its own
  // layers in the order it wants. A name added here would be a second library to order against.
  expect(LAYER_ORDER_STATEMENT).toBe('@layer sui;')
})

test('layerOrderPlugin() prepends the statement to the emitted stylesheet only', () => {
  const plugin = layerOrderPlugin()
  const bundle = {
    'bundle.css': {type: 'asset', source: '.a {\n  gap: 4px;\n}\n'},
    'other.css': {type: 'asset', source: '.b {}\n'},
  }

  // generateBundle is a Rolldown hook — call it directly with a mock context
  ;(plugin.generateBundle as Function).call({}, {} as never, bundle)

  expect(bundle['bundle.css'].source).toBe(`${LAYER_ORDER_STATEMENT}\n.a {\n  gap: 4px;\n}\n`)
  expect(bundle['other.css'].source).toBe('.b {}\n')
})
