import {defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSourceFromConfig} from '../resolveConfig'
import {type SingletonDefinition} from '../types'

const projectId = 'ppsg7ml5'
const dataset = 'production'

const settingsSchema = defineType({
  name: 'settings',
  type: 'document',
  fields: [{name: 'title', type: 'string'}],
})

const articleSchema = defineType({
  name: 'article',
  type: 'document',
  fields: [{name: 'title', type: 'string'}],
})

const seoSchema = defineType({
  name: 'seo',
  type: 'object',
  fields: [{name: 'title', type: 'string'}],
})

describe('prepareConfig — singleton registry validation', () => {
  it('rejects a singleton referencing a schema type that does not exist', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [{id: 'missing', documentId: 'missing', schemaType: 'missing'}],
        },
      }),
    ).rejects.toThrow(/references schema type "missing", which does not exist in the schema/)
  })

  it('rejects a singleton referencing a non-document schema type', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema, seoSchema]},
        document: {
          singletons: [{id: 'seo', documentId: 'seo', schemaType: 'seo'}],
        },
      }),
    ).rejects.toThrow(/references schema type "seo", which is not a document type/)
  })

  it('rejects an empty `id`', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [{id: '', documentId: 'settings', schemaType: 'settings'}],
        },
      }),
    ).rejects.toThrow(/must have a non-empty string `id`/)
  })

  it('rejects an empty `documentId`', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [{id: 'settings', documentId: '', schemaType: 'settings'}],
        },
      }),
    ).rejects.toThrow(/must have a non-empty string `documentId`/)
  })

  it('rejects a `documentId` with the `drafts.` prefix', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [{id: 'settings', documentId: 'drafts.settings', schemaType: 'settings'}],
        },
      }),
    ).rejects.toThrow(/invalid `documentId` "drafts\.settings"/)
  })

  it('rejects a `documentId` with the `versions.` prefix', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [
            {id: 'settings', documentId: 'versions.release.settings', schemaType: 'settings'},
          ],
        },
      }),
    ).rejects.toThrow(/invalid `documentId` "versions\.release\.settings"/)
  })

  it('rejects a `documentId` containing illegal characters', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {types: [settingsSchema]},
        document: {
          singletons: [{id: 'settings', documentId: 'foo bar', schemaType: 'settings'}],
        },
      }),
    ).rejects.toThrow(/invalid `documentId` "foo bar"/)
  })

  it('rejects duplicate definition ids, listing every offender in a single error', async () => {
    const error = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [
          {id: 'a', documentId: 'a1', schemaType: 'settings'},
          {id: 'a', documentId: 'a2', schemaType: 'settings'},
          {id: 'b', documentId: 'b1', schemaType: 'article'},
          {id: 'b', documentId: 'b2', schemaType: 'article'},
        ],
      },
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toMatch(/Duplicate singleton definition ids found: a, b/)
  })

  it('rejects duplicate document ids, listing every offender in a single error', async () => {
    const error = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [
          {id: 'a1', documentId: 'shared', schemaType: 'settings'},
          {id: 'a2', documentId: 'shared', schemaType: 'settings'},
          {id: 'b1', documentId: 'alsoShared', schemaType: 'article'},
          {id: 'b2', documentId: 'alsoShared', schemaType: 'article'},
        ],
      },
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toMatch(
      /Multiple singleton definitions claim the same document id: shared, alsoShared/,
    )
  })

  it('aggregates multiple validation failures rather than throwing on the first', async () => {
    const error = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: [
          {id: 'draftPrefixed', documentId: 'drafts.foo', schemaType: 'settings'},
          {id: 'missingType', documentId: 'missing', schemaType: 'missing'},
        ],
      },
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    const message = String(error)
    expect(message).toMatch(/draftPrefixed/)
    expect(message).toMatch(/missingType/)
  })
})

describe('prepareConfig — singleton registry resolution', () => {
  it('exposes resolved definitions on `source.document.singletons`', async () => {
    const definition: SingletonDefinition = {
      id: 'settingsSingleton',
      documentId: 'settingsDocument',
      schemaType: 'settings',
    }

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: [definition],
      },
    })

    expect(source.document.singletons).toEqual([definition])
  })

  it('exposes an inherited `id` when the definition omits it', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: [{documentId: 'settingsDocument', schemaType: 'settings'}],
      },
    })

    expect(source.document.singletons).toEqual([
      {id: 'settingsDocument', documentId: 'settingsDocument', schemaType: 'settings'},
    ])
  })

  it('rejects an explicit `id` colliding with an inherited one', async () => {
    const error = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [
          // Inherits id 'shared' from its documentId…
          {documentId: 'shared', schemaType: 'settings'},
          // …which collides with this explicit definition id.
          {id: 'shared', documentId: 'other', schemaType: 'article'},
        ],
      },
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toMatch(/Duplicate singleton definition ids found: shared/)
  })

  it('expands the string shorthand before exposing definitions', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: ['settings'],
      },
    })

    expect(source.document.singletons).toEqual([
      {id: 'settings', documentId: 'settings', schemaType: 'settings'},
    ])
  })

  it('resolves to an empty registry when no singletons are configured', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
    })

    expect(source.document.singletons).toEqual([])
  })

  it('supports a resolver function receiving previously resolved definitions', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: (previous) => [
          ...previous,
          {id: 'promotedArticle', documentId: 'promotedArticle', schemaType: 'article'},
        ],
      },
    })

    expect(source.document.singletons).toEqual([
      {id: 'promotedArticle', documentId: 'promotedArticle', schemaType: 'article'},
    ])
  })

  it('allows multiple singletons to share a schema type', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [articleSchema]},
      document: {
        singletons: [
          {id: 'featuredArticle', documentId: 'featuredArticle', schemaType: 'article'},
          {id: 'editorsPick', documentId: 'editorsPick', schemaType: 'article'},
        ],
      },
    })

    expect(source.document.singletons).toHaveLength(2)
  })
})
