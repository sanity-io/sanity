import {describe, expectTypeOf, test} from 'vitest'

import {type ContributedDocumentTool, type DocumentToolId, type SanityDefinedToolId} from '../tools'

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

describe('SANITY_DEFINED_TOOL_IDS', () => {
  test('matches the SanityDefinedToolId union exactly', () => {
    expectTypeOf<SanityDefinedToolId>().toEqualTypeOf<EveryPublishedId>()
  })

  test('registers every published id in DocumentToolIds', () => {
    expectTypeOf<EveryPublishedId>().toExtend<DocumentToolId>()
  })
})
