import {describe, expectTypeOf, test} from 'vitest'

import {
  type DocumentFeature,
  type DocumentFeatureHeaderEntry,
  type DocumentFeatureMenuEntry,
  type DocumentFeatureName,
  type SanityDefinedFeatureName,
} from '../features'
import {type DocumentFieldAction} from '../fieldActions/types'
import {type DocumentInspector} from '../inspector'

type EveryPublishedName =
  | 'titleBar'
  | 'versionPicker'
  | 'copyActions'
  | 'inspect'
  | 'compareVersions'
  | 'inlineChanges'
  | 'productionPreview'
  | 'copyField'
  | 'pasteField'
  | 'history'
  | 'validation'
  | 'incomingReferences'
  | 'splitPane'
  | 'focusMode'
  | 'closePane'
  | 'closePaneGroup'

describe('SANITY_DEFINED_FEATURE_NAMES', () => {
  test('matches the SanityDefinedFeatureName union exactly', () => {
    expectTypeOf<SanityDefinedFeatureName>().toEqualTypeOf<EveryPublishedName>()
  })

  test('every Sanity-defined name is a DocumentFeatureName', () => {
    expectTypeOf<SanityDefinedFeatureName>().toExtend<DocumentFeatureName>()
  })

  test('DocumentFeatureName accepts a name Sanity never defined', () => {
    expectTypeOf<'ai-assistance'>().toExtend<DocumentFeatureName>()
    expectTypeOf<string>().toExtend<DocumentFeatureName>()
  })
})

describe('DocumentFeature', () => {
  test('a feature carrying a name, an inspector, a field action and a toolbar entry is a DocumentFeature', () => {
    expectTypeOf<{
      name: 'ai-assistance'
      inspector: DocumentInspector
      fieldAction: DocumentFieldAction
      toolbar: DocumentFeatureHeaderEntry
    }>().toExtend<DocumentFeature>()
  })

  test('a bare named feature is a DocumentFeature', () => {
    expectTypeOf<{name: 'titleBar'}>().toExtend<DocumentFeature>()
  })

  test('a header entry cannot carry an onAction callback', () => {
    const feature: DocumentFeature = {
      name: 'acmeRibbon',
      toolbar: {
        placement: 'header',
        render: () => null,
        // @ts-expect-error a header entry wires its own behaviour inside `render`
        onAction: () => {},
      },
    }
    expectTypeOf(feature).toExtend<DocumentFeature>()
  })

  test('a menu entry cannot carry a render component', () => {
    const entry: DocumentFeatureMenuEntry = {
      placement: 'menu',
      title: 'Ribbon',
      onAction: () => {},
      // @ts-expect-error a menu entry is data; the overflow menu renders no contributed component
      render: () => null,
    }
    expectTypeOf(entry).toExtend<DocumentFeature['toolbar']>()
  })
})
