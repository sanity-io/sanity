import {type SchemaTypeDefinition, type SearchStrategy} from '@sanity/types'
import {type ErrorInfo} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {
  advancedVersionControlEnabledReducer,
  announcementsEnabledReducer,
  commentsV2EnabledReducer,
  directUploadsReducer,
  documentActionsReducer,
  documentBadgesReducer,
  documentCommentsEnabledReducer,
  documentGroupInventoryEnabledReducer,
  documentInspectorsReducer,
  documentLanguageFilterReducer,
  draftsEnabledReducer,
  eventsAPIReducer,
  fileAssetSourceResolver,
  imageAssetSourceResolver,
  internalTasksReducer,
  localeBundlesReducer,
  localeDefReducer,
  mediaLibraryEnabledReducer,
  mediaLibraryFrontendHostReducer,
  mediaLibraryLibraryIdReducer,
  newDocumentOptionsResolver,
  onUncaughtErrorResolver,
  partialIndexingEnabledReducer,
  releaseActionsReducer,
  resolveProductionUrlReducer,
  scheduledDraftsEnabledReducer,
  schemaTemplatesReducer,
  schemaTypesReducer,
  searchStrategyReducer,
  toolsReducer,
  variantsEnabledReducer,
} from '../configPropertyReducers'
import {type PluginOptions} from '../types'

const context = {} as never

const typeA: SchemaTypeDefinition = {name: 'a', type: 'document', fields: []}
const typeB: SchemaTypeDefinition = {name: 'b', type: 'document', fields: []}

interface ArrayReducerExample {
  name: string
  reduce: (prev: unknown[], config: PluginOptions, ctx: unknown) => unknown[]
  set: (value: unknown) => PluginOptions
  expectedError: string
}

const arrayReducers: ArrayReducerExample[] = [
  {
    name: 'schema.types',
    reduce: schemaTypesReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', schema: {types: value as SchemaTypeDefinition[]}}),
    expectedError: 'Expected `schema.types` to be an array or a function, but received number',
  },
  {
    name: 'tools',
    reduce: toolsReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', tools: value as PluginOptions['tools']}),
    expectedError: 'Expected `tools` to be an array or a function, but received number',
  },
  {
    name: 'schema.templates',
    reduce: schemaTemplatesReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', schema: {templates: value as never}}),
    expectedError: 'Expected `schema.templates` to be an array or a function, but received number',
  },
  {
    name: 'i18n.locales',
    reduce: localeDefReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', i18n: {locales: value as never}}),
    expectedError: 'Expected `i18n.locales` to be an array or a function, but received number',
  },
  {
    name: 'i18n.bundles',
    reduce: localeBundlesReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', i18n: {bundles: value as never}}),
    expectedError: 'Expected `i18n.bundles` to be an array or a function, but received number',
  },
  {
    name: 'document.badges',
    reduce: documentBadgesReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', document: {badges: value as never}}),
    expectedError: 'Expected `document.badges` to be an array or a function, but received number',
  },
  {
    name: 'document.actions',
    reduce: documentActionsReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', document: {actions: value as never}}),
    expectedError: 'Expected `document.actions` to be an array or a function, but received number',
  },
  {
    name: 'releases.actions',
    reduce: releaseActionsReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', releases: {actions: value as never}}),
    expectedError: 'Expected `releases.actions` to be an array or a function, but received number',
  },
  {
    name: 'form.file.assetSources',
    reduce: fileAssetSourceResolver as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', form: {file: {assetSources: value as never}}}),
    expectedError:
      'Expected `form.file.assetSources` to be an array or a function, but received number',
  },
  {
    name: 'form.image.assetSources',
    reduce: imageAssetSourceResolver as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', form: {image: {assetSources: value as never}}}),
    expectedError:
      'Expected `form.image.assetSources` to be an array or a function, but received number',
  },
  {
    name: 'document.unstable_languageFilter',
    reduce: documentLanguageFilterReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', document: {unstable_languageFilter: value as never}}),
    expectedError:
      'Expected `document.unstable_languageFilter` to be an array or a function, but received number',
  },
  {
    name: 'document.inspectors',
    reduce: documentInspectorsReducer as ArrayReducerExample['reduce'],
    set: (value) => ({name: 'test', document: {inspectors: value as never}}),
    expectedError:
      'Expected `document.inspectors` to be an array or a function, but received number',
  },
]

describe('array and function config reducers', () => {
  it.each(arrayReducers)(
    '$name keeps the previous value when the property is missing',
    ({reduce}) => {
      expect(reduce(['kept'], {name: 'test'}, context)).toEqual(['kept'])
    },
  )

  it.each(arrayReducers)('$name treats null as missing', ({reduce, set}) => {
    expect(reduce(['kept'], set(null), context)).toEqual(['kept'])
  })

  it.each(arrayReducers)('$name concatenates an array onto the previous value', ({reduce, set}) => {
    expect(reduce(['prev'], set(['next']), context)).toEqual(['prev', 'next'])
  })

  it.each(arrayReducers)(
    '$name invokes a function with the previous value and context',
    ({reduce, set}) => {
      const resolver = vi.fn(() => ['from-fn'])
      expect(reduce(['prev'], set(resolver), context)).toEqual(['from-fn'])
      expect(resolver).toHaveBeenCalledWith(['prev'], context)
    },
  )

  it.each(arrayReducers)(
    '$name throws when the property is neither an array nor a function',
    ({reduce, set, expectedError}) => {
      expect(() => reduce([], set(1), context)).toThrow(expectedError)
    },
  )
})

describe('newDocumentOptionsResolver', () => {
  it('keeps the previous value when newDocumentOptions is missing', () => {
    expect(newDocumentOptionsResolver(['kept'] as never, {name: 'test'}, context)).toEqual(['kept'])
  })

  it('invokes the resolver with the previous value and context', () => {
    const resolver = vi.fn(() => ['resolved'])
    expect(
      newDocumentOptionsResolver(
        ['prev'] as never,
        {name: 'test', document: {newDocumentOptions: resolver as never}},
        context,
      ),
    ).toEqual(['resolved'])
    expect(resolver).toHaveBeenCalledWith(['prev'], context)
  })

  it('throws when newDocumentOptions is not a function', () => {
    expect(() =>
      newDocumentOptionsResolver(
        [],
        {name: 'test', document: {newDocumentOptions: [] as never}},
        context,
      ),
    ).toThrow('Expected `document.resolveNewDocumentOptions` to be a function, but received array')
  })
})

describe('resolveProductionUrlReducer', () => {
  it('keeps the previous value when productionUrl is missing', async () => {
    await expect(resolveProductionUrlReducer('kept', {name: 'test'}, context)).resolves.toBe('kept')
  })

  it('awaits the configured resolver', async () => {
    const resolver = vi.fn(async () => 'https://example.test/preview')
    await expect(
      resolveProductionUrlReducer(
        undefined,
        {name: 'test', document: {productionUrl: resolver}},
        context,
      ),
    ).resolves.toBe('https://example.test/preview')
    expect(resolver).toHaveBeenCalledWith(undefined, context)
  })

  it('rejects when the resolver rejects', async () => {
    await expect(
      resolveProductionUrlReducer(
        undefined,
        {
          name: 'test',
          document: {
            productionUrl: async () => {
              throw new Error('preview failed')
            },
          },
        },
        context,
      ),
    ).rejects.toThrow('preview failed')
  })
})

describe('directUploadsReducer', () => {
  it('defaults to true when no config is provided', () => {
    expect(directUploadsReducer({config: {name: 'test'}, schemaTypeName: 'file'})).toBe(true)
    expect(directUploadsReducer({config: {name: 'test'}, schemaTypeName: 'image'})).toBe(true)
  })

  it('returns the last configured boolean, with the root config winning over plugins', () => {
    const config: PluginOptions = {
      name: 'root',
      form: {file: {directUploads: true}},
      plugins: [{name: 'plugin', form: {file: {directUploads: false}}}],
    }

    expect(directUploadsReducer({config, schemaTypeName: 'file'})).toBe(true)
  })

  it('throws when the value is not a boolean', () => {
    expect(() =>
      directUploadsReducer({
        config: {name: 'test', form: {image: {directUploads: 'yes' as never}}},
        schemaTypeName: 'image',
      }),
    ).toThrow('Expected `form.image.directUploads` to be a boolean, but received string')
  })
})

describe('documentCommentsEnabledReducer', () => {
  it('returns the initial value when comments are not configured', () => {
    expect(
      documentCommentsEnabledReducer({
        config: {name: 'test'},
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toBe(true)
  })

  it('reads the last configured value, preferring document.comments over unstable_comments', () => {
    expect(
      documentCommentsEnabledReducer({
        config: {
          name: 'test',
          document: {
            comments: {enabled: true},
            unstable_comments: {enabled: false},
          } as never,
        },
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: false,
      }),
    ).toBe(true)
  })

  it('falls back to document.unstable_comments.enabled when comments is absent', () => {
    expect(
      documentCommentsEnabledReducer({
        config: {
          name: 'test',
          document: {unstable_comments: {enabled: false}} as never,
        },
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('invokes a function resolver with the document context', () => {
    const enabled = vi.fn(() => true)
    expect(
      documentCommentsEnabledReducer({
        config: {name: 'test', document: {comments: {enabled}}},
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: false,
      }),
    ).toBe(true)
    expect(enabled).toHaveBeenCalledWith({documentId: 'doc1', documentType: 'article'})
  })

  it('lets the last plugin win, then the root config', () => {
    expect(
      documentCommentsEnabledReducer({
        config: {
          name: 'root',
          document: {comments: {enabled: true}},
          plugins: [
            {name: 'plugin-a', document: {comments: {enabled: true}}},
            {name: 'plugin-b', document: {comments: {enabled: false}}},
          ],
        },
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toBe(true)
  })

  it('throws when enabled is neither a boolean nor a function', () => {
    expect(() =>
      documentCommentsEnabledReducer({
        config: {name: 'test', document: {comments: {enabled: 'yes' as never}}},
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toThrow(
      'Expected `document.comments.enabled` to be a boolean or a function, but received string',
    )
  })
})

describe('eventsAPIReducer', () => {
  it('returns the initial value when eventsAPI is not configured', () => {
    expect(eventsAPIReducer({config: {name: 'test'}, initialValue: false, key: 'documents'})).toBe(
      false,
    )
  })

  it('returns the last boolean for the requested key', () => {
    expect(
      eventsAPIReducer({
        config: {
          name: 'root',
          beta: {eventsAPI: {releases: true}},
          plugins: [{name: 'plugin', beta: {eventsAPI: {releases: false}}}],
        },
        initialValue: false,
        key: 'releases',
      }),
    ).toBe(true)
  })

  it('still reduces the documents key', () => {
    expect(
      eventsAPIReducer({
        config: {name: 'test', beta: {eventsAPI: {documents: true} as never}},
        initialValue: false,
        key: 'documents',
      }),
    ).toBe(true)
  })

  it('throws when the removed enabled flag is truthy', () => {
    expect(() =>
      eventsAPIReducer({
        config: {name: 'test', beta: {eventsAPI: {enabled: true} as never}},
        initialValue: false,
        key: 'releases',
      }),
    ).toThrow(
      'The `beta.eventsAPI.enabled` option has been removed. Use `beta.eventsAPI.releases` instead.',
    )
  })

  it('does not throw when the removed enabled flag is false', () => {
    expect(
      eventsAPIReducer({
        config: {name: 'test', beta: {eventsAPI: {enabled: false} as never}},
        initialValue: true,
        key: 'documents',
      }),
    ).toBe(true)
  })

  it('throws when the key is not a boolean', () => {
    expect(() =>
      eventsAPIReducer({
        config: {name: 'test', beta: {eventsAPI: {releases: 'yes' as never}}},
        initialValue: false,
        key: 'releases',
      }),
    ).toThrow('Expected `beta.eventsAPI.releases` to be a boolean, but received string')
  })
})

describe('variantsEnabledReducer', () => {
  it('returns the initial value when beta.variants is missing', () => {
    expect(variantsEnabledReducer({config: {name: 'test'}, initialValue: false})).toBe(false)
  })

  it('returns the last configured enabled flag, with the root config winning', () => {
    expect(
      variantsEnabledReducer({
        config: {
          name: 'root',
          beta: {variants: {enabled: true}},
          plugins: [{name: 'plugin', beta: {variants: {enabled: false}}}],
        },
        initialValue: false,
      }),
    ).toBe(true)
  })

  it('keeps the previous value when enabled is omitted from the namespace', () => {
    expect(
      variantsEnabledReducer({
        config: {name: 'test', beta: {variants: {} as never}},
        initialValue: true,
      }),
    ).toBe(true)
  })

  it('throws when beta.variants is not an object', () => {
    expect(() =>
      variantsEnabledReducer({
        config: {name: 'test', beta: {variants: true as never}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.variants` to be an object, but received boolean')
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      variantsEnabledReducer({
        config: {name: 'test', beta: {variants: {enabled: 'yes' as never}}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.variants.enabled` to be a boolean, but received string')
  })
})

describe('commentsV2EnabledReducer', () => {
  it('returns the last configured boolean, with the root config winning', () => {
    expect(
      commentsV2EnabledReducer({
        config: {
          name: 'root',
          beta: {comments: {v2: false}},
          plugins: [{name: 'plugin', beta: {comments: {v2: true}}}],
        },
        initialValue: false,
      }),
    ).toBe(false)
  })

  it('throws when beta.comments is not an object', () => {
    expect(() =>
      commentsV2EnabledReducer({
        config: {name: 'test', beta: {comments: true as never}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.comments` to be an object, but received boolean')
  })

  it('throws when v2 is not a boolean', () => {
    expect(() =>
      commentsV2EnabledReducer({
        config: {name: 'test', beta: {comments: {v2: 'yes' as never}}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.comments.v2` to be a boolean, but received string')
  })
})

describe('documentGroupInventoryEnabledReducer', () => {
  it('returns the last configured boolean, with the root config winning', () => {
    expect(
      documentGroupInventoryEnabledReducer({
        config: {
          name: 'root',
          beta: {documentGroupInventory: {enabled: true}},
          plugins: [{name: 'plugin', beta: {documentGroupInventory: {enabled: false}}}],
        },
        initialValue: false,
      }),
    ).toBe(true)
  })

  it('throws when beta.documentGroupInventory is not an object', () => {
    expect(() =>
      documentGroupInventoryEnabledReducer({
        config: {name: 'test', beta: {documentGroupInventory: true as never}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.documentGroupInventory` to be an object, but received boolean')
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      documentGroupInventoryEnabledReducer({
        config: {name: 'test', beta: {documentGroupInventory: {enabled: 'yes' as never}}},
        initialValue: false,
      }),
    ).toThrow('Expected `beta.documentGroupInventory.enabled` to be a boolean, but received string')
  })
})

describe('mediaLibraryEnabledReducer', () => {
  it('returns the last boolean, with the root config winning', () => {
    expect(
      mediaLibraryEnabledReducer({
        config: {
          name: 'root',
          mediaLibrary: {enabled: false},
          plugins: [{name: 'plugin', mediaLibrary: {enabled: true}}],
        },
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      mediaLibraryEnabledReducer({
        config: {name: 'test', mediaLibrary: {enabled: 'yes' as never}},
        initialValue: false,
      }),
    ).toThrow('Expected `mediaLibrary.enabled` to be a boolean, but received string')
  })
})

describe('mediaLibraryLibraryIdReducer', () => {
  it('returns the last string library id, with the root config winning', () => {
    expect(
      mediaLibraryLibraryIdReducer({
        config: {
          name: 'root',
          mediaLibrary: {libraryId: 'root-lib'},
          plugins: [{name: 'plugin', mediaLibrary: {libraryId: 'plugin-lib'}}],
        },
        initialValue: undefined,
      }),
    ).toBe('root-lib')
  })

  it('keeps the initial value when libraryId is missing', () => {
    expect(mediaLibraryLibraryIdReducer({config: {name: 'test'}, initialValue: 'existing'})).toBe(
      'existing',
    )
  })

  it('throws when libraryId is not a string', () => {
    expect(() =>
      mediaLibraryLibraryIdReducer({
        config: {name: 'test', mediaLibrary: {libraryId: 12 as never}},
        initialValue: undefined,
      }),
    ).toThrow('Expected `mediaLibrary.libraryId` to be a string, but received number')
  })
})

describe('mediaLibraryFrontendHostReducer', () => {
  it('returns the last configured host', () => {
    expect(
      mediaLibraryFrontendHostReducer({
        config: {name: 'test', mediaLibrary: {__internal: {frontendHost: 'https://ml.test'}}},
        initialValue: undefined,
      }),
    ).toBe('https://ml.test')
  })

  it('throws when frontendHost is not a string', () => {
    expect(() =>
      mediaLibraryFrontendHostReducer({
        config: {name: 'test', mediaLibrary: {__internal: {frontendHost: 1 as never}}},
        initialValue: undefined,
      }),
    ).toThrow('Expected `mediaLibrary.__internal.frontendHost` to be a string, but received number')
  })
})

describe('scheduledDraftsEnabledReducer', () => {
  it('returns the last boolean, with the root config winning', () => {
    expect(
      scheduledDraftsEnabledReducer({
        config: {
          name: 'root',
          scheduledDrafts: {enabled: false},
          plugins: [{name: 'plugin', scheduledDrafts: {enabled: true}}],
        },
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      scheduledDraftsEnabledReducer({
        config: {name: 'test', scheduledDrafts: {enabled: 'yes' as never}},
        initialValue: true,
      }),
    ).toThrow('Expected a boolean, but received string')
  })
})

describe('partialIndexingEnabledReducer', () => {
  it('returns the last boolean, with the root config winning', () => {
    expect(
      partialIndexingEnabledReducer({
        config: {
          name: 'root',
          search: {unstable_partialIndexing: {enabled: true}},
          plugins: [{name: 'plugin', search: {unstable_partialIndexing: {enabled: false}}}],
        },
        initialValue: false,
      }),
    ).toBe(true)
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      partialIndexingEnabledReducer({
        config: {name: 'test', search: {unstable_partialIndexing: {enabled: 'yes' as never}}},
        initialValue: false,
      }),
    ).toThrow(
      'Expected `search.unstable_partialIndexing.enabled` to be a boolean, but received string',
    )
  })
})

describe('draftsEnabledReducer', () => {
  it('keeps the previous value when drafts.enabled is missing', () => {
    expect(draftsEnabledReducer(true, {name: 'test'}, context)).toBe(true)
  })

  it('returns a configured boolean', () => {
    expect(
      draftsEnabledReducer(true, {name: 'test', document: {drafts: {enabled: false}}}, context),
    ).toBe(false)
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      draftsEnabledReducer(
        true,
        {name: 'test', document: {drafts: {enabled: 'yes' as never}}},
        context,
      ),
    ).toThrow('Expected boolean, but received string')
  })
})

describe('searchStrategyReducer', () => {
  it('returns the initial strategy when none is configured', () => {
    expect(searchStrategyReducer({config: {name: 'test'}, initialValue: 'groq2024'})).toBe(
      'groq2024',
    )
  })

  it('returns the last configured strategy, with the root config winning', () => {
    expect(
      searchStrategyReducer({
        config: {
          name: 'root',
          search: {strategy: 'groq2024'},
          plugins: [{name: 'plugin', search: {strategy: 'groqLegacy'}}],
        },
        initialValue: 'groqLegacy',
      }),
    ).toBe('groq2024')
  })

  it('throws when the strategy is an unknown string', () => {
    expect(() =>
      searchStrategyReducer({
        config: {name: 'test', search: {strategy: 'lucene' as SearchStrategy}},
        initialValue: 'groq2024',
      }),
    ).toThrow('Expected `search.strategy` to be "groq2024" or "groqLegacy", but received "lucene"')
  })

  it('throws when the strategy is not a string', () => {
    expect(() =>
      searchStrategyReducer({
        config: {name: 'test', search: {strategy: 1 as never}},
        initialValue: 'groq2024',
      }),
    ).toThrow('Expected `search.strategy` to be "groq2024" or "groqLegacy", but received number')
  })
})

describe('announcementsEnabledReducer', () => {
  it('returns the last boolean, with the root config winning', () => {
    expect(
      announcementsEnabledReducer({
        config: {
          name: 'root',
          announcements: {enabled: false},
          plugins: [{name: 'plugin', announcements: {enabled: true}}],
        },
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('throws when enabled is not a boolean', () => {
    expect(() =>
      announcementsEnabledReducer({
        config: {name: 'test', announcements: {enabled: 'yes' as never}},
        initialValue: true,
      }),
    ).toThrow('Expected `announcements.enabled` to be a boolean, but received string')
  })
})

describe('advancedVersionControlEnabledReducer', () => {
  it('keeps the previous value when the flag is missing', () => {
    expect(advancedVersionControlEnabledReducer(true, {name: 'test'}, context)).toBe(true)
  })

  it('returns a configured boolean', () => {
    expect(
      advancedVersionControlEnabledReducer(
        false,
        {name: 'test', advancedVersionControl: {enabled: true}},
        context,
      ),
    ).toBe(true)
  })

  it('invokes a function resolver with the previous value and context', () => {
    const enabled = vi.fn(() => false)
    expect(
      advancedVersionControlEnabledReducer(
        true,
        {name: 'test', advancedVersionControl: {enabled}},
        context,
      ),
    ).toBe(false)
    expect(enabled).toHaveBeenCalledWith(true, context)
  })

  it('throws when enabled is neither a boolean nor a function', () => {
    expect(() =>
      advancedVersionControlEnabledReducer(
        true,
        {name: 'test', advancedVersionControl: {enabled: 'yes' as never}},
        context,
      ),
    ).toThrow('Expected boolean, but received string')
  })
})

describe('onUncaughtErrorResolver', () => {
  const error = new Error('boom')
  const errorInfo = {componentStack: 'stack'} as ErrorInfo

  it('invokes every configured handler', () => {
    const pluginHandler = vi.fn()
    const rootHandler = vi.fn()

    onUncaughtErrorResolver({
      config: {
        name: 'root',
        onUncaughtError: rootHandler,
        plugins: [{name: 'plugin', onUncaughtError: pluginHandler}],
      },
      context: {error, errorInfo},
    })

    expect(pluginHandler).toHaveBeenCalledWith(error, errorInfo)
    expect(rootHandler).toHaveBeenCalledWith(error, errorInfo)
  })

  it('skips missing handlers', () => {
    expect(() =>
      onUncaughtErrorResolver({
        config: {name: 'test'},
        context: {error, errorInfo},
      }),
    ).not.toThrow()
  })

  it('throws when a handler is not a function', () => {
    expect(() =>
      onUncaughtErrorResolver({
        config: {name: 'test', onUncaughtError: 'nope' as never},
        context: {error, errorInfo},
      }),
    ).toThrow('Expected `document.onUncaughtError` to be a a function, but received string')
  })
})

describe('internalTasksReducer', () => {
  it('returns undefined when no plugin configures internal tasks', () => {
    expect(internalTasksReducer({config: {name: 'test'}})).toBeUndefined()
  })

  it('returns the last object that has a footerAction', () => {
    const footerAction = 'footer'
    expect(
      internalTasksReducer({
        config: {
          name: 'root',
          __internal_tasks: {footerAction},
          plugins: [{name: 'plugin', __internal_tasks: {footerAction: 'plugin-footer'}}],
        },
      }),
    ).toEqual({footerAction})
  })

  it('throws when the value is not an object with footerAction', () => {
    expect(() =>
      internalTasksReducer({
        config: {name: 'test', __internal_tasks: {} as never},
      }),
    ).toThrow('Expected `__internal__tasks` to be an object with footerAction, but received object')
  })
})

describe('schemaTypesReducer', () => {
  it('concatenates schema type definitions in plugin then root order', () => {
    const pluginTypes = [typeA]
    const rootTypes = [typeB]
    const fromPlugin = schemaTypesReducer(
      [],
      {name: 'plugin', schema: {types: pluginTypes}},
      context,
    )
    const fromRoot = schemaTypesReducer(
      fromPlugin,
      {name: 'root', schema: {types: rootTypes}},
      context,
    )

    expect(fromRoot).toEqual([typeA, typeB])
  })
})
