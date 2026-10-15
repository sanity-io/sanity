import {expect, test} from 'vitest'

import {
  layerOrderStatement,
  pandaLayerNames,
  pandaLayerOrder,
  pandaLayers,
  STUDIO_LAYER_ORDER,
} from '../layerOrder.ts'

test('every @sanity/ui layer comes before every studio layer, ui5 first', () => {
  const index = (layer: string) => STUDIO_LAYER_ORDER.indexOf(layer)
  const uiLayers = [...pandaLayerNames('u'), 'u-styled']
  const studioLayers = pandaLayerNames('sanity')

  expect(index('sui')).toBe(0)
  for (const ui of uiLayers) {
    expect(index(ui)).toBeGreaterThan(index('sui'))
    for (const studio of studioLayers) expect(index(studio)).toBeGreaterThan(index(ui))
  }
  // `ThemeProvider` of @sanity/ui emits this order itself (sanity-io/ui#3233); the studio's longer
  // statement has to agree with it
  const uiStatement = ['sui', 'u-tokens', 'u-utilities', 'u-styled']
  expect(uiStatement.map(index)).toEqual([...uiStatement.map(index)].sort((a, b) => a - b))
  expect(layerOrderStatement(STUDIO_LAYER_ORDER)).toBe(
    '@layer sui, u-reset, u-base, u-tokens, u-recipes, u-utilities, u-styled, sanity-reset, sanity-base, sanity-tokens, sanity-recipes, sanity-utilities;',
  )
})

test('pandaLayers() names the five Panda layers after the prefix, in Panda order', () => {
  expect(pandaLayers('sanity')).toEqual({
    reset: 'sanity-reset',
    base: 'sanity-base',
    tokens: 'sanity-tokens',
    recipes: 'sanity-recipes',
    utilities: 'sanity-utilities',
  })
  expect(pandaLayerNames('x')).toEqual([
    'x-reset',
    'x-base',
    'x-tokens',
    'x-recipes',
    'x-utilities',
  ])
})

test('pandaLayerOrder() prepends the statement to the emitted stylesheet only', () => {
  const plugin = pandaLayerOrder()
  const bundle = {
    'bundle.css': {
      type: 'asset',
      source: '@layer sanity-utilities {\n  .a {\n    gap: 4px;\n  }\n}\n',
    },
    'other.css': {type: 'asset', source: '.b {}\n'},
  }

  // generateBundle is a Rolldown hook — call it directly with a mock context
  ;(plugin.generateBundle as Function).call({}, {} as never, bundle)

  expect(bundle['bundle.css'].source).toBe(
    `${layerOrderStatement(STUDIO_LAYER_ORDER)}\n@layer sanity-utilities {\n  .a {\n    gap: 4px;\n  }\n}\n`,
  )
  expect(bundle['other.css'].source).toBe('.b {}\n')
})
