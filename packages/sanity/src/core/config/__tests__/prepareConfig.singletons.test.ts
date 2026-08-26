import {defineType} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type ResolvedTemplate} from '../../templates/types'
import {type DocumentActionComponent} from '../document/actions'
import {createSourceFromConfig} from '../resolveConfig'
import {type DocumentActionsContext, type SingletonDefinition} from '../types'

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

const settingsSingleton: SingletonDefinition = {
  id: 'settingsSingleton',
  documentId: 'settingsDocument',
  schemaType: 'settings',
}

describe('prepareConfig — singleton templates and new-document-options filtering', () => {
  it('replaces the plain per-type template with a tagged singleton template', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {singletons: [settingsSingleton]},
    })

    // The singleton definition gets its own template, tagged with the
    // definition id, keeping an initial-value source in `source.templates`.
    const singletonTemplate = source.templates.find(
      (template) => template.singleton === 'settingsSingleton',
    )
    expect(singletonTemplate).toBeDefined()
    expect(singletonTemplate?.id).toBe('settingsSingleton')
    expect(singletonTemplate?.schemaType).toBe('settings')

    // The plain per-type template is not generated for singleton-claimed
    // types…
    expect(source.templates.find((template) => template.id === 'settings')).toBeUndefined()
    // …but is for ordinary types.
    const articleTemplate = source.templates.find((template) => template.id === 'article')
    expect(articleTemplate).toBeDefined()
    expect(articleTemplate?.singleton).toBeUndefined()
  })

  it('uses `definition.initialValue` for the singleton template, falling back to the schema type', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [
          {...settingsSingleton, initialValue: {title: 'From the definition'}},
          {id: 'featuredArticle', documentId: 'featuredArticle', schemaType: 'article'},
        ],
      },
    })

    const settingsTemplate = source.templates.find(
      (template) => template.singleton === 'settingsSingleton',
    )
    expect(settingsTemplate?.value).toEqual({title: 'From the definition'})

    // No definition-level initial value → the schema type's applies.
    const articleTemplate = source.templates.find(
      (template) => template.singleton === 'featuredArticle',
    )
    expect(articleTemplate?.value).toEqual({_type: 'article'})
  })

  it('removes the auto-generated new-document option for singleton schema types', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {singletons: [settingsSingleton]},
    })

    const globalOptions = source.document.resolveNewDocumentOptions({type: 'global'})
    const schemaTypes = new Set(globalOptions.map((item) => item.schemaType))
    expect(schemaTypes.has('settings')).toBe(false)
    expect(schemaTypes.has('article')).toBe(true)
  })

  it('filters the structure and document creation contexts too', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {singletons: [settingsSingleton]},
    })

    const structureOptions = source.document.resolveNewDocumentOptions({
      type: 'structure',
      schemaType: 'settings',
    })
    expect(structureOptions).toEqual([])

    const documentOptions = source.document.resolveNewDocumentOptions({
      type: 'document',
      documentId: 'settingsDocument',
      schemaType: 'settings',
    })
    const documentSchemaTypes = new Set(documentOptions.map((item) => item.schemaType))
    expect(documentSchemaTypes.has('settings')).toBe(false)
  })

  it('keeps untagged user-defined templates for a schema type shared with a singleton', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {
        types: [settingsSchema, articleSchema],
        templates: (previous) => [
          ...previous,
          {
            id: 'settings-with-defaults',
            title: 'Settings with defaults',
            schemaType: 'settings',
            value: {title: 'Defaults'},
          },
          // The plain per-type template no longer exists for singleton-claimed
          // types, so even the type name itself is available as a template id.
          {
            id: 'settings',
            title: 'Settings',
            schemaType: 'settings',
            value: {},
          },
        ],
      },
      document: {singletons: [settingsSingleton]},
    })

    const globalOptions = source.document.resolveNewDocumentOptions({type: 'global'})
    const templateIds = new Set(globalOptions.map((item) => item.templateId))
    // The explicit untagged templates are offered…
    expect(templateIds.has('settings-with-defaults')).toBe(true)
    expect(templateIds.has('settings')).toBe(true)
    // …while the tagged singleton template stays filtered.
    expect(templateIds.has('settingsSingleton')).toBe(false)
  })

  it('keeps filtering a customised singleton template as long as the tag is preserved', async () => {
    // Mapping over the singleton's template (matched by its id, which equals
    // the definition id) and spreading it is the way to customise a
    // singleton's initial value via `schema.templates`. The authoring type
    // doesn't expose the `singleton` tag, but the spread preserves it, so the
    // template keeps benefiting initial value resolution without becoming a
    // create option.
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {
        types: [settingsSchema, articleSchema],
        templates: (previous) =>
          previous.map((template) =>
            template.id === 'settingsSingleton'
              ? {...template, value: {title: 'Customised'}}
              : template,
          ),
      },
      document: {singletons: [settingsSingleton]},
    })

    const settingsTemplate = source.templates.find(
      (template) => template.singleton === 'settingsSingleton',
    )
    expect(settingsTemplate?.value).toEqual({title: 'Customised'})

    const globalOptions = source.document.resolveNewDocumentOptions({type: 'global'})
    const templateIds = new Set(globalOptions.map((item) => item.templateId))
    expect(templateIds.has('settingsSingleton')).toBe(false)
  })

  it('rejects an untagged template reusing a singleton definition id', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [settingsSchema],
          templates: (previous) => [
            ...previous,
            {
              id: 'settingsSingleton',
              title: 'Impostor',
              schemaType: 'settings',
              value: {},
            },
          ],
        },
        document: {singletons: [settingsSingleton]},
      }),
    ).rejects.toThrow(/reuses the id of singleton definition "settingsSingleton"/)
  })

  it('rejects multiple templates tagged with the same singleton definition id', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [settingsSchema],
          // The authoring `Template` type doesn't expose `singleton`, but
          // untyped JS configs can still set it — the `ResolvedTemplate`
          // return type exercises the runtime validation for that case.
          templates: (previous): ResolvedTemplate[] => [
            ...previous,
            {
              id: 'second-settings-template',
              title: 'Second settings template',
              schemaType: 'settings',
              value: {},
              singleton: 'settingsSingleton',
            },
          ],
        },
        document: {singletons: [settingsSingleton]},
      }),
    ).rejects.toThrow(
      /Multiple templates are tagged with the same singleton definition id: settingsSingleton/,
    )
  })

  it('rejects a template tagged with an unregistered singleton definition id', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        schema: {
          types: [settingsSchema],
          // See above — exercises runtime validation of a tag only settable
          // from untyped JS configs.
          templates: (previous): ResolvedTemplate[] => [
            ...previous,
            {
              id: 'mystery-template',
              title: 'Mystery template',
              schemaType: 'settings',
              value: {},
              singleton: 'unregistered',
            },
          ],
        },
        document: {singletons: [settingsSingleton]},
      }),
    ).rejects.toThrow(/tagged with singleton "unregistered", which is not registered/)
  })
})

describe('prepareConfig — singleton context injection', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  async function createSingletonSource(
    onActionsContext: (receivedContext: DocumentActionsContext) => void,
  ) {
    return createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [settingsSingleton],
        actions: (previous, receivedContext) => {
          onActionsContext(receivedContext)
          return previous
        },
      },
    })
  }

  it('injects `context.singleton` for the published document id', async () => {
    let received: DocumentActionsContext | undefined
    const source = await createSingletonSource((receivedContext) => {
      received = receivedContext
    })

    source.document.actions({
      schemaType: 'settings',
      documentId: 'settingsDocument',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(received?.singleton).toBe('settingsSingleton')
  })

  it('injects `context.singleton` for draft and version document ids', async () => {
    let received: DocumentActionsContext | undefined
    const source = await createSingletonSource((receivedContext) => {
      received = receivedContext
    })

    source.document.actions({
      schemaType: 'settings',
      documentId: 'drafts.settingsDocument',
      versionType: 'draft',
      releaseId: undefined,
    })
    expect(received?.singleton).toBe('settingsSingleton')

    source.document.actions({
      schemaType: 'settings',
      documentId: 'versions.rRelease.settingsDocument',
      versionType: 'version',
      releaseId: 'rRelease',
    })
    expect(received?.singleton).toBe('settingsSingleton')
  })

  it('leaves `context.singleton` undefined for unrelated documents', async () => {
    let received: DocumentActionsContext | undefined
    const source = await createSingletonSource((receivedContext) => {
      received = receivedContext
    })

    source.document.actions({
      schemaType: 'article',
      documentId: 'someArticle',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(received?.singleton).toBeUndefined()
  })

  it('leaves `context.singleton` undefined (and warns) when the schema type does not match', async () => {
    let received: DocumentActionsContext | undefined
    const source = await createSingletonSource((receivedContext) => {
      received = receivedContext
    })

    source.document.actions({
      schemaType: 'article',
      documentId: 'settingsDocument',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(received?.singleton).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('matches the document id of singleton "settingsSingleton"'),
    )
  })

  it('injects `context.singleton` into badge, inspector, field action, comments, and ask-to-edit contexts', async () => {
    const receivedSingletons: Record<string, string | undefined> = {}

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: [settingsSingleton],
        badges: (previous, receivedContext) => {
          receivedSingletons.badges = receivedContext.singleton
          return previous
        },
        inspectors: (previous, receivedContext) => {
          receivedSingletons.inspectors = receivedContext.singleton
          return previous
        },
        unstable_fieldActions: (previous, receivedContext) => {
          receivedSingletons.fieldActions = receivedContext.singleton
          return previous
        },
        comments: {
          enabled: (receivedContext) => {
            receivedSingletons.comments = receivedContext.singleton
            return true
          },
        },
        askToEdit: {
          enabled: (receivedContext) => {
            receivedSingletons.askToEdit = receivedContext.singleton
            return true
          },
        },
      },
    })

    source.document.badges({schemaType: 'settings', documentId: 'settingsDocument'})
    source.document.inspectors({documentType: 'settings', documentId: 'settingsDocument'})
    source.document.unstable_fieldActions({
      documentType: 'settings',
      documentId: 'settingsDocument',
      schemaType: source.schema.get('settings')!,
    })
    source.document.comments.enabled({
      documentType: 'settings',
      documentId: 'settingsDocument',
    })
    source.document.askToEdit.enabled({
      documentType: 'settings',
      documentId: 'settingsDocument',
    })

    expect(receivedSingletons).toEqual({
      badges: 'settingsSingleton',
      inspectors: 'settingsSingleton',
      fieldActions: 'settingsSingleton',
      comments: 'settingsSingleton',
      askToEdit: 'settingsSingleton',
    })
  })
})

describe('prepareConfig — singleton duplicate action filtering', () => {
  const fakeDuplicate: DocumentActionComponent = Object.assign(() => null, {
    action: 'duplicate' as const,
  })
  const fakePublish: DocumentActionComponent = Object.assign(() => null, {
    action: 'publish' as const,
  })

  it('removes the duplicate action for singleton documents only', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema, articleSchema]},
      document: {
        singletons: [settingsSingleton],
        actions: () => [fakeDuplicate, fakePublish],
      },
    })

    const settingsActions = source.document.actions({
      schemaType: 'settings',
      documentId: 'settingsDocument',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(settingsActions.find((action) => action.action === 'duplicate')).toBeUndefined()
    expect(settingsActions.find((action) => action.action === 'publish')).toBeDefined()

    const articleActions = source.document.actions({
      schemaType: 'article',
      documentId: 'someArticle',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(articleActions.find((action) => action.action === 'duplicate')).toBeDefined()
  })

  it('cannot be bypassed by a user resolver that re-adds the duplicate action', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      schema: {types: [settingsSchema]},
      document: {
        singletons: [settingsSingleton],
        // A poorly-behaved user resolver explicitly re-introduces the
        // duplicate action. The built-in singleton filter must still strip it.
        actions: (previous) => [...previous, fakeDuplicate],
      },
    })

    const settingsActions = source.document.actions({
      schemaType: 'settings',
      documentId: 'settingsDocument',
      versionType: 'published',
      releaseId: undefined,
    })
    expect(settingsActions.find((action) => action.action === 'duplicate')).toBeUndefined()
  })
})
