import {describe, expectTypeOf, test} from 'vitest'

import {
  type ContributedDocumentTool,
  type ContributedHeaderTool,
  type ContributedMenuTool,
  type DocumentToolId,
  type SanityDefinedToolId,
} from '../tools'

declare module '../tools' {
  interface DocumentToolIds {
    acmeRibbon: never
  }
}

type EveryPublishedId =
  | 'titleBar'
  | 'versionPicker'
  | 'copyActions'
  | 'inspect'
  | 'compareVersions'
  | 'inlineChanges'
  | 'productionPreview'
  | 'splitPane'
  | 'focusMode'
  | 'closePane'
  | 'closePaneGroup'

describe('DocumentToolIds', () => {
  test('a declaration-merged id is a DocumentToolId', () => {
    expectTypeOf<'acmeRibbon'>().toExtend<DocumentToolId>()
    expectTypeOf<{
      id: 'acmeRibbon'
      placement: 'header'
      render: () => null
    }>().toExtend<ContributedDocumentTool>()
  })

  test('an id nobody registered is not a DocumentToolId', () => {
    expectTypeOf<'neverRegistered'>().not.toExtend<DocumentToolId>()
    const tool: ContributedDocumentTool = {
      // @ts-expect-error `neverRegistered` was never merged into `DocumentToolIds`
      id: 'neverRegistered',
      placement: 'header',
      render: () => null,
    }
    expectTypeOf(tool).toExtend<ContributedDocumentTool>()
  })

  test('every Sanity-defined id stays a DocumentToolId', () => {
    expectTypeOf<SanityDefinedToolId>().toExtend<DocumentToolId>()
  })

  test('merging widens DocumentToolId beyond the Sanity-defined ids', () => {
    expectTypeOf<DocumentToolId>().not.toEqualTypeOf<SanityDefinedToolId>()
  })
})

describe('ContributedDocumentTool', () => {
  test('a menu tool is a ContributedDocumentTool', () => {
    expectTypeOf<{
      id: 'acmeRibbon'
      placement: 'menu'
      title: string
      onAction: () => void
    }>().toExtend<ContributedDocumentTool>()
  })

  test('a menu tool cannot carry a render component', () => {
    const tool: ContributedMenuTool = {
      id: 'acmeRibbon',
      placement: 'menu',
      title: 'Ribbon',
      onAction: () => {},
      // @ts-expect-error a menu tool is data; the overflow menu renders no contributed component
      render: () => null,
    }
    expectTypeOf(tool).toExtend<ContributedDocumentTool>()
  })

  test('a header tool cannot carry an onAction callback', () => {
    const tool: ContributedHeaderTool = {
      id: 'acmeRibbon',
      placement: 'header',
      render: () => null,
      // @ts-expect-error a header tool wires its own behaviour inside `render`
      onAction: () => {},
    }
    expectTypeOf(tool).toExtend<ContributedDocumentTool>()
  })

  test('a header tool cannot carry a shortcut', () => {
    const tool: ContributedHeaderTool = {
      id: 'acmeRibbon',
      placement: 'header',
      render: () => null,
      // @ts-expect-error nothing fires a header tool's shortcut; it wires its own hotkey
      shortcut: 'Ctrl+Alt+R',
    }
    expectTypeOf(tool).toExtend<ContributedDocumentTool>()
  })
})

describe('SANITY_DEFINED_TOOL_IDS', () => {
  test('matches the SanityDefinedToolId union exactly', () => {
    expectTypeOf<SanityDefinedToolId>().toEqualTypeOf<EveryPublishedId>()
  })

  test('registers every published id in DocumentToolIds', () => {
    expectTypeOf<EveryPublishedId>().toExtend<DocumentToolId>()
  })
})
