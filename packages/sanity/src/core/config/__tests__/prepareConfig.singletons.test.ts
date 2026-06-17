import {defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type DocumentActionComponent} from '../document/actions'
import {createSourceFromConfig} from '../resolveConfig'

const projectId = 'ppsg7ml5'
const dataset = 'production'

const settingsSchema = defineType({
  name: 'settings',
  type: 'document',
  singleton: {documentId: 'settings'},
  fields: [{name: 'title', type: 'string'}],
})

const articleSchema = defineType({
  name: 'article',
  type: 'document',
  fields: [{name: 'title', type: 'string'}],
})

describe('prepareConfig — singleton validation', () => {
  it('rejects an empty `singleton.documentId`', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [
            defineType({
              name: 'broken',
              type: 'document',
              singleton: {documentId: ''},
              fields: [{name: 'title', type: 'string'}],
            }),
          ],
        },
      }),
    ).rejects.toThrow(/`singleton\.documentId` that is not a non-empty string/)
  })

  it('rejects a `documentId` with the `drafts.` prefix', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [
            defineType({
              name: 'broken',
              type: 'document',
              singleton: {documentId: 'drafts.settings'},
              fields: [{name: 'title', type: 'string'}],
            }),
          ],
        },
      }),
    ).rejects.toThrow(/invalid `singleton\.documentId` "drafts\.settings"/)
  })

  it('rejects a `documentId` containing illegal characters', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [
            defineType({
              name: 'broken',
              type: 'document',
              singleton: {documentId: 'foo bar'},
              fields: [{name: 'title', type: 'string'}],
            }),
          ],
        },
      }),
    ).rejects.toThrow(/invalid `singleton\.documentId` "foo bar"/)
  })

  it('rejects two schema types claiming the same `documentId` and lists every claimant', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [
            defineType({
              name: 'a',
              type: 'document',
              singleton: {documentId: 'shared'},
              fields: [{name: 'title', type: 'string'}],
            }),
            defineType({
              name: 'b',
              type: 'document',
              singleton: {documentId: 'shared'},
              fields: [{name: 'title', type: 'string'}],
            }),
          ],
        },
      }),
    ).rejects.toThrow(/Multiple schema types claim singleton document id "shared": a, b/)
  })

  it('aggregates multiple validation failures rather than throwing on the first', async () => {
    const error = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {
        types: [
          defineType({
            name: 'emptyId',
            type: 'document',
            singleton: {documentId: ''},
            fields: [{name: 'title', type: 'string'}],
          }),
          defineType({
            name: 'draftPrefix',
            type: 'document',
            singleton: {documentId: 'drafts.foo'},
            fields: [{name: 'title', type: 'string'}],
          }),
        ],
      },
    }).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    const message = String(error.message ?? error)
    expect(message).toMatch(/emptyId/)
    expect(message).toMatch(/draftPrefix/)
  })

  it('accepts a valid singleton schema definition', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
    })
    expect(source.schema.get('settings')?.singleton?.documentId).toBe('settings')
  })
})

describe('prepareConfig — singleton auto-filtering', () => {
  it('does not include a singleton type in the auto-generated newDocumentOptions', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
    })

    const globalOptions = source.document.resolveNewDocumentOptions({type: 'global'})
    const schemaTypes = new Set(globalOptions.map((item) => item.schemaType))
    expect(schemaTypes.has('settings')).toBe(false)
    expect(schemaTypes.has('article')).toBe(true)
  })

  it('returns no creatable templates inside a singleton structure context', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
    })

    // Structure context filters templates to those matching `schemaType`—
    // since the singleton type's auto-template is gone, the result is empty.
    const structureOptions = source.document.resolveNewDocumentOptions({
      type: 'structure',
      schemaType: 'settings',
    })
    expect(structureOptions).toEqual([])

    // The 'document' creation context keeps every template regardless of
    // schema type (so a user can create siblings/cross-referenced docs from
    // within an open document). The singleton itself must still be absent.
    const documentOptions = source.document.resolveNewDocumentOptions({
      type: 'document',
      documentId: 'settings',
      schemaType: 'settings',
    })
    const documentSchemaTypes = new Set(documentOptions.map((item) => item.schemaType))
    expect(documentSchemaTypes.has('settings')).toBe(false)
  })

  it('removes the duplicate action for singleton schema types', async () => {
    // Stand-in duplicate action mirrors useDuplicateAction.action = 'duplicate'.
    const fakeDuplicate: DocumentActionComponent = Object.assign(() => null, {
      action: 'duplicate' as const,
      displayName: 'TestDuplicate',
    })
    const fakePublish: DocumentActionComponent = Object.assign(() => null, {
      action: 'publish' as const,
      displayName: 'TestPublish',
    })

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        actions: () => [fakeDuplicate, fakePublish],
      },
    })

    const settingsActions = source.document.actions({
      schemaType: 'settings',
      documentId: 'settings',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(settingsActions.find((a) => a.action === 'duplicate')).toBeUndefined()
    expect(settingsActions.find((a) => a.action === 'publish')).toBeDefined()

    const articleActions = source.document.actions({
      schemaType: 'article',
      documentId: 'article',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(articleActions.find((a) => a.action === 'duplicate')).toBeDefined()
  })

  it('cannot be bypassed by a user resolver that re-adds the duplicate action', async () => {
    const fakeDuplicate: DocumentActionComponent = Object.assign(() => null, {
      action: 'duplicate' as const,
      displayName: 'TestDuplicate',
    })

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        // A poorly-behaved user resolver explicitly re-introduces the duplicate
        // action. The built-in singleton filter must still strip it.
        actions: (prev) => [...prev, fakeDuplicate],
      },
    })

    const settingsActions = source.document.actions({
      schemaType: 'settings',
      documentId: 'settings',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(settingsActions.find((a) => a.action === 'duplicate')).toBeUndefined()
  })
})
