import {createClient} from '@sanity/client'
import {firstValueFrom, lastValueFrom, of} from 'rxjs'
import {bufferTime} from 'rxjs/operators'
import {describe, expect, it} from 'vitest'

import {createMockAuthStore} from '../../store'
import {VARIANTS_NAME} from '../../variants/plugin'
import {definePlugin} from '../definePlugin'
import {createSourceFromConfig, createWorkspaceFromConfig, resolveConfig} from '../resolveConfig'
import {type PluginOptions} from '../types'

describe('resolveConfig', () => {
  it('throws on invalid tools property', async () => {
    expect.assertions(1)
    try {
      await firstValueFrom(
        resolveConfig({
          projectId: 'ppsg7ml5',
          dataset: 'production',
          // @ts-expect-error should be an array
          tools: {},
        }),
      )
    } catch (err) {
      expect(err.message).toMatch(
        'Expected `tools` to be an array or a function, but received object',
      )
    }
  })

  it('returns an observable that emits an array of fully resolved workspaces', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })

    const [workspace] = await firstValueFrom(
      resolveConfig({
        //the default name should be 'default', in both the workspace and the unstable_sources
        //name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
      }),
    )

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })

  it('emits a new value if the auth stores emit a new auth state', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })

    const results = await lastValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: {
          state: of(
            {authenticated: true, client, currentUser: null},
            {
              authenticated: true,
              client,
              currentUser: {
                id: 'test',
                name: 'test',
                email: 'hello@example.com',
                role: '',
                roles: [],
              },
            },
          ),
        },
      })
        // this will buffer the results emitted in the observable into an array
        .pipe(bufferTime(50)),
    )

    expect(results).toHaveLength(2)
    const [firstResult, secondResult] = results

    expect(firstResult).toMatchObject([
      {
        name: 'default',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        currentUser: null,
        unstable_sources: [
          {
            dataset: 'production',
            name: 'default',
            projectId: 'ppsg7ml5',
          },
        ],
      },
    ])

    expect(secondResult).toMatchObject([
      {
        type: 'workspace',
        name: 'default',
        projectId: 'ppsg7ml5',
        dataset: 'production',
        // note the extra user here
        currentUser: {
          id: 'test',
          name: 'test',
          email: 'hello@example.com',
        },
        unstable_sources: [
          {
            dataset: 'production',
            name: 'default',
            projectId: 'ppsg7ml5',
          },
        ],
      },
    ])
  })

  it('includes all the default plugins', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const mockPlugin = definePlugin({name: 'sanity/mock-plugin'})
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [mockPlugin()],
      }),
    )
    expect(workspace.__internal.options.plugins).toMatchObject([
      {name: 'sanity/mock-plugin'},
      {name: 'sanity/comments'},
      {name: 'sanity/tasks'},
      {name: 'sanity/scheduled-publishing'},
      {name: 'sanity/releases'},
      {name: 'sanity/canvas-integration'},
      {name: 'sanity/schedules'},
      {name: 'sanity/singleDocRelease'},
    ])
  })
  it('wont include variants default plugin by default', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
      }),
    )
    const pluginNames = workspace.__internal.options.plugins?.map((p) => p.name) ?? []
    expect(pluginNames).not.toContain(VARIANTS_NAME)
  })
  it('includes variants default plugin when the feature is enabled', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
        beta: {
          variants: {
            enabled: true,
          },
        },
      }),
    )
    const pluginNames = workspace.__internal.options.plugins?.map((p) => p.name) ?? []
    expect(pluginNames).toContain(VARIANTS_NAME)
  })
  it('wont include releases plugin if the feature is disabled', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
        releases: {
          enabled: false,
        },
      }),
    )
    const pluginNames = workspace.__internal.options.plugins?.map((p) => p.name) ?? []
    expect(pluginNames).toContain('sanity/singleDocRelease')
    expect(pluginNames).toContain('sanity/schedules')
    expect(pluginNames).not.toContain('sanity/releases')
  })
  it('wont include single doc release plugin if the feature is disabled', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
        scheduledDrafts: {
          enabled: false,
        },
      }),
    )
    const pluginNames = workspace.__internal.options.plugins?.map((p) => p.name) ?? []
    expect(pluginNames).not.toContain('sanity/singleDocRelease')
    expect(pluginNames).toContain('sanity/schedules')
    expect(pluginNames).toContain('sanity/releases')
  })
  it('wont include schedules, if both releases and single doc is disabled', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
        releases: {
          enabled: false,
        },
        scheduledDrafts: {
          enabled: false,
        },
      }),
    )
    const pluginNames = workspace.__internal.options.plugins?.map((p) => p.name) ?? []
    expect(pluginNames).not.toContain('sanity/singleDocRelease')
    expect(pluginNames).not.toContain('sanity/schedules')
    expect(pluginNames).not.toContain('sanity/releases')
  })

  it('wont include scheduled publishing default plugin', async () => {
    // Schedule publishing should not be included when none other plugin is included in the user config.
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const client = createClient({
      projectId,
      apiVersion: '2021-06-07',
      dataset,
      useCdn: false,
    })
    const [workspace] = await firstValueFrom(
      resolveConfig({
        name: 'default',
        dataset,
        projectId,
        auth: createMockAuthStore({client, currentUser: null}),
        plugins: [], // No plugins
      }),
    )

    expect(workspace.__internal.options.plugins).toMatchObject([
      {name: 'sanity/comments'},
      {name: 'sanity/tasks'},
      {name: 'sanity/releases'},
      {name: 'sanity/canvas-integration'},
      {name: 'sanity/schedules'},
      {name: 'sanity/singleDocRelease'},
    ])
  })
})

describe('createWorkspaceFromConfig', () => {
  it('creates a promise that resolves to a full workspace', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'

    const workspace = await createWorkspaceFromConfig({
      projectId,
      dataset,
      name: 'default',
    })

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: null,
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })

  it('allows overriding the `currentUser` and `getClient`', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'
    const getClient = () =>
      createClient({
        projectId,
        apiVersion: '2021-06-07',
        dataset,
        useCdn: false,
      })
    const currentUser = {
      id: 'test',
      name: 'test',
      email: 'hello@example.com',
      role: '',
      roles: [],
    }

    const workspace = await createWorkspaceFromConfig({
      projectId,
      dataset,
      name: 'default',
      getClient,
      currentUser,
    })

    expect(workspace).toMatchObject({
      type: 'workspace',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: {
        id: 'test',
        name: 'test',
        email: 'hello@example.com',
      },
      unstable_sources: [
        {
          dataset: 'production',
          name: 'default',
          projectId: 'ppsg7ml5',
        },
      ],
    })
  })
})

describe('createSourceFromConfig', () => {
  it('calls `createWorkspaceFromConfig` and returns the first source', async () => {
    const projectId = 'ppsg7ml5'
    const dataset = 'production'

    const source = await createSourceFromConfig({
      projectId,
      dataset,
      name: 'default',
    })

    expect(source).toMatchObject({
      type: 'source',
      name: 'default',
      projectId: 'ppsg7ml5',
      dataset: 'production',
      currentUser: null,
    })
  })
})

describe('beta variants config', () => {
  const projectId = 'ppsg7ml5'
  const dataset = 'production'

  it('defaults variants to false', async () => {
    const source = await createSourceFromConfig({projectId, dataset})

    expect(source.beta?.variants?.enabled).toBe(false)
  })

  it('resolves variants from root config', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      beta: {variants: {enabled: true}},
    })

    expect(source.beta?.variants?.enabled).toBe(true)
  })

  it('resolves variants from plugin config', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      plugins: [
        definePlugin({
          name: 'sanity/beta-variants',
          beta: {variants: {enabled: true}},
        })(),
      ],
    })

    expect(source.beta?.variants?.enabled).toBe(true)
  })

  it('lets root config override plugin variants config', async () => {
    const source = await createSourceFromConfig({
      projectId,
      dataset,
      plugins: [
        definePlugin({
          name: 'sanity/beta-variants',
          beta: {variants: {enabled: false}},
        })(),
      ],
      beta: {variants: {enabled: true}},
    })

    expect(source.beta?.variants?.enabled).toBe(true)
  })

  it('throws when variants is not an object', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        beta: {
          // @ts-expect-error should be an object
          variants: 'enabled',
        },
      }),
    ).rejects.toThrow('Expected `beta.variants` to be an object, but received string')
  })

  it('throws when variants enabled is not a boolean', async () => {
    await expect(
      createSourceFromConfig({
        projectId,
        dataset,
        beta: {
          variants: {
            // @ts-expect-error should be a boolean
            enabled: 'enabled',
          },
        },
      }),
    ).rejects.toThrow('Expected `beta.variants.enabled` to be a boolean, but received string')
  })
})

describe('search strategy selection', () => {
  const projectId = 'ppsg7ml5'
  const dataset = 'production'

  it('sets a default strategy', async () => {
    const workspace = await createWorkspaceFromConfig({
      projectId,
      dataset,
    })

    expect(workspace.search.strategy).toBeTypeOf('string')
  })

  it('infers strategy based on `enableLegacySearch`', async () => {
    const workspaceA = await createWorkspaceFromConfig({
      projectId,
      dataset,
      search: {
        enableLegacySearch: true,
      },
    })

    expect(workspaceA.search.strategy).toBe('groqLegacy')

    const workspaceB = await createWorkspaceFromConfig({
      projectId,
      dataset,
      search: {
        enableLegacySearch: false,
      },
    })

    expect(workspaceB.search.strategy).toBe('groq2024')
  })

  it('gives precedence to `strategy`', async () => {
    const workspaceA = await createWorkspaceFromConfig({
      projectId,
      dataset,
      search: {
        enableLegacySearch: true,
        strategy: 'groq2024',
      },
    })

    expect(workspaceA.search.strategy).toBe('groq2024')

    const workspaceB = await createWorkspaceFromConfig({
      projectId,
      dataset,
      search: {
        enableLegacySearch: false,
        strategy: 'groqLegacy',
      },
    })

    expect(workspaceB.search.strategy).toBe('groqLegacy')
  })

  it('can be composed with other configurations', async () => {
    const workspaceA = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          enableLegacySearch: false,
        }),
      ],
      search: {
        enableLegacySearch: true,
      },
    })

    expect(workspaceA.search.strategy).toBe('groqLegacy')

    const workspaceB = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          enableLegacySearch: true,
        }),
      ],
      search: {
        enableLegacySearch: false,
      },
    })

    expect(workspaceB.search.strategy).toBe('groq2024')

    const workspaceC = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          enableLegacySearch: false,
        }),
      ],
      search: {
        strategy: 'groqLegacy',
      },
    })

    expect(workspaceC.search.strategy).toBe('groqLegacy')

    const workspaceD = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          strategy: 'groq2024',
        }),
      ],
      search: {
        strategy: 'groqLegacy',
      },
    })

    expect(workspaceD.search.strategy).toBe('groqLegacy')

    const workspaceE = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          strategy: 'groq2024',
        }),
      ],
      search: {
        enableLegacySearch: true,
      },
    })

    expect(workspaceE.search.strategy).toBe('groq2024')

    const workspaceF = await createWorkspaceFromConfig({
      projectId,
      dataset,
      plugins: [
        getSearchOptionsPlugin({
          strategy: 'groqLegacy',
        }),
      ],
      search: {
        enableLegacySearch: false,
      },
    })

    expect(workspaceF.search.strategy).toBe('groqLegacy')
  })
})

function getSearchOptionsPlugin(options: PluginOptions['search']): PluginOptions {
  return definePlugin({
    name: 'sanity/search-options',
    search: options,
  })()
}
