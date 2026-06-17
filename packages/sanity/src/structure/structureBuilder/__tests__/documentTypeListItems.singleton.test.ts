import {defineType} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../core/schema'
import {createStructureBuilder} from '../createStructureBuilder'
import {type StructureBuilder} from '../types'

function createBuilder(): StructureBuilder {
  const schema = createSchema({
    name: 'default',
    types: [
      defineType({
        name: 'settings',
        type: 'document',
        singleton: {documentId: 'settings'},
        fields: [{name: 'title', type: 'string'}],
      }),
      defineType({
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  })

  const source = {
    schema,
    i18n: {t: (key: string) => key},
    document: {
      resolveNewDocumentOptions: () => [],
    },
  } as unknown as Parameters<typeof createStructureBuilder>[0]['source']

  return createStructureBuilder({source, perspectiveStack: []})
}

describe('default content list filtering', () => {
  it('skips singleton schema types', () => {
    const S = createBuilder()
    const items = S.documentTypeListItems()
    const ids = items.map((item) => item.getId())
    expect(ids).toContain('article')
    expect(ids).not.toContain('settings')
  })
})

describe('S.documentTypeList for a singleton type', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  // Combined into a single test because the warning is module-level
  // de-duplicated, so we can only meaningfully observe the first call within
  // a single Vitest run.
  it('does not throw and warns once in dev mode about the misuse', () => {
    const S = createBuilder()
    expect(() => S.documentTypeList('settings')).not.toThrow()
    // Second call should not emit another warning.
    S.documentTypeList('settings')

    const singletonWarnings = consoleWarnSpy.mock.calls.filter((call) =>
      String(call[0]).includes('S.documentTypeList("settings")'),
    )
    expect(singletonWarnings.length).toBe(1)
    expect(singletonWarnings[0][0]).toMatch(/singleton schema type/)
    expect(singletonWarnings[0][0]).toMatch(/S\.listItem\(\)\.singleton\("settings"\)/)
  })
})
