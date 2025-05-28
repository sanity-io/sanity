import {type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MANIFEST_FILENAME} from '../../../src/_internal/cli/actions/manifest/extractManifestAction'
import {
  deleteSchemaAction,
  type DeleteSchemaFlags,
} from '../../../src/_internal/cli/actions/schema/deleteSchemaAction'
import {type SchemaStoreContext} from '../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {getWorkspaceSchemaId} from '../../../src/_internal/cli/actions/schema/utils/workspaceSchemaId'
import {
  CURRENT_WORKSPACE_SCHEMA_VERSION,
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
  SANITY_WORKSPACE_SCHEMA_TYPE,
  type StoredWorkspaceSchema,
} from '../../../src/_internal/manifest/manifestTypes'
import {createSchemaStoreFixture} from './mocks/schemaStoreFixture'
import {
  createMockJsonReader,
  createMockSanityClient,
  createMockSchemaStoreContext,
  getMockStoreKey,
} from './mocks/schemaStoreMocks'

const fixture = createSchemaStoreFixture(new Date().toISOString())
const {files, testSchema, testWorkspace, testMultiWorkspaceManifest, staticDate, workDir} = fixture

const workspace1 = testMultiWorkspaceManifest.workspaces[0]
const workspace2 = testMultiWorkspaceManifest.workspaces[1]
const workspace3 = testMultiWorkspaceManifest.workspaces[2]

const validStoredSchema1: StoredWorkspaceSchema = {
  _id: getWorkspaceSchemaId({workspaceName: workspace1.name}).safeTaggedId,
  _type: SANITY_WORKSPACE_SCHEMA_TYPE,
  version: CURRENT_WORKSPACE_SCHEMA_VERSION,
  workspace: workspace1,
  schema: JSON.stringify(testSchema),
  _createdAt: staticDate,
}
const validStoredSchema2: StoredWorkspaceSchema = {
  ...validStoredSchema1,
  _id: getWorkspaceSchemaId({workspaceName: workspace2.name}).safeTaggedId,
  workspace: workspace2,
}
const validStoredSchema3: StoredWorkspaceSchema = {
  ...validStoredSchema1,
  _id: getWorkspaceSchemaId({workspaceName: workspace3.name}).safeTaggedId,
  workspace: workspace3,
}

describe('deleteSchemasAction', () => {
  let defaultContext: SchemaStoreContext
  let log: any[]
  //dataset -> id -> schema
  let mockStores: Record<string, Record<string, SanityDocumentLike | undefined>> = {}
  let mockClient: SanityClient

  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    const {
      context,
      outputLog,
      apiClient,
      mockStores: stores,
    } = createMockSchemaStoreContext(fixture, {
      jsonReader: createMockJsonReader({
        staticDate,
        files: {
          ...files,
          // tests assume multi workspace manifest by default
          [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testMultiWorkspaceManifest,
        },
      }),
    })

    mockStores = stores
    await apiClient.withConfig({dataset: workspace1.dataset}).createOrReplace(validStoredSchema1)
    // these two share dataset
    await apiClient.withConfig({dataset: workspace2.dataset}).createOrReplace(validStoredSchema2)
    await apiClient.withConfig({dataset: workspace3.dataset}).createOrReplace(validStoredSchema3)

    mockClient = apiClient
    defaultContext = context
    log = outputLog
  })

  it('should delete schema document in dataset by provided id (should not log error when found in any dataset)', async () => {
    const flags: DeleteSchemaFlags = {ids: validStoredSchema2._id}
    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {success: 'Successfully deleted 1/1 schemas'},
    ])
    expect(status).toEqual('success')
  })

  it('should delete all schema in dataset by provided ids (should not log error when found in any dataset)', async () => {
    const flags: DeleteSchemaFlags = {
      ids: [validStoredSchema1, validStoredSchema2, validStoredSchema3].map((s) => s._id).join(','),
    }
    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {success: 'Successfully deleted 3/3 schemas'},
    ])
    expect(status).toEqual('success')
  })

  it('should trim individual ids', async () => {
    const flags: DeleteSchemaFlags = {
      ids: [validStoredSchema1, validStoredSchema2].map((s) => s._id).join('    ,  '),
    }
    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {success: 'Successfully deleted 2/2 schemas'},
    ])
    expect(status).toEqual('success')
  })

  it('should throw on duplicate ids', async () => {
    const flags: DeleteSchemaFlags = {
      ids: [validStoredSchema1, validStoredSchema1].map((s) => s._id).join('    , '),
    }
    await expect(() => deleteSchemaAction(flags, defaultContext)).rejects.toThrowError(
      'Invalid arguments:\n  - ids contains duplicates',
    )
    expect(log).toEqual([])
  })

  it('should throw on _id incompatible ids', async () => {
    const flags: DeleteSchemaFlags = {
      ids: 'not_valid%&/',
    }
    await expect(() => deleteSchemaAction(flags, defaultContext)).rejects.toThrowError(
      'Invalid arguments:\n  - id can only contain characters in [a-zA-Z0-9._-] but found: "not_valid%&/"',
    )
  })

  it('should throw on id not matching valid pattern', async () => {
    const flags: DeleteSchemaFlags = {
      ids: 'invalid-id',
    }
    await expect(() => deleteSchemaAction(flags, defaultContext)).rejects.toThrowError(
      'Invalid arguments:\n  - id must either match _.schemas.<workspaceName> or _.schemas.<workspaceName>.tag.<tag> but found: "invalid-id". ' +
        'Note that workspace name characters not in [a-zA-Z0-9_-] has to be replaced with _ for schema id.',
    )
  })

  it('should list queries dataset also when id matches no workspaces', async () => {
    const flags: DeleteSchemaFlags = {
      ids: '_.schemas.nonexistentWorkspace',
    }
    const status = await deleteSchemaAction(flags, defaultContext)
    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error: [
          'Deleted 0/1 schemas.',
          'Ids not found in ["{"projectId":"testProjectId","dataset":"testDataset"}","{"projectId":"testProjectId","dataset":"reusedDataset"}"]:',
          '- _.schemas.nonexistentWorkspace',
        ].join('\n'),
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should log which datasets where searched when no schema found', async () => {
    await mockClient.withConfig({dataset: workspace1.dataset}).delete(validStoredSchema1._id)
    await mockClient.withConfig({dataset: workspace2.dataset}).delete(validStoredSchema2._id)
    await mockClient.withConfig({dataset: workspace3.dataset}).delete(validStoredSchema3._id)

    const flags: DeleteSchemaFlags = {
      ids: [validStoredSchema1, validStoredSchema2, validStoredSchema3].map((s) => s._id).join(','),
    }

    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Deleted 0/3 schemas.\n' +
          'Ids not found in ["{"projectId":"testProjectId","dataset":"testDataset"}","{"projectId":"testProjectId","dataset":"reusedDataset"}"]:\n' +
          '- _.schemas.testWorkspace\n' +
          '- _.schemas.testWorkspace2\n' +
          '- _.schemas.testWorkspace3',
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should only check --dataset', async () => {
    await mockClient.withConfig({dataset: workspace1.dataset}).delete(validStoredSchema1._id)
    await mockClient.withConfig({dataset: workspace2.dataset}).delete(validStoredSchema2._id)
    await mockClient.withConfig({dataset: workspace3.dataset}).delete(validStoredSchema3._id)

    const flags: DeleteSchemaFlags = {
      dataset: workspace1.dataset,
      ids: [validStoredSchema1, validStoredSchema2, validStoredSchema3].map((s) => s._id).join(','),
    }

    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Deleted 0/3 schemas.\n' +
          'Ids not found in {"projectId":"testProjectId","dataset":"testDataset"}:\n' +
          '- _.schemas.testWorkspace\n' +
          '- _.schemas.testWorkspace2\n' +
          '- _.schemas.testWorkspace3',
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should be a failure on partial deletion (documents not found)', async () => {
    await mockClient.withConfig({dataset: workspace1.dataset}).delete(validStoredSchema1._id)
    await mockClient.withConfig({dataset: workspace3.dataset}).delete(validStoredSchema3._id)

    const flags: DeleteSchemaFlags = {
      ids: [validStoredSchema1, validStoredSchema2, validStoredSchema3].map((s) => s._id).join(','),
    }

    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error: [
          'Deleted 1/3 schemas.',
          'Successfully deleted ids:',
          '- _.schemas.testWorkspace2 (in {"projectId":"testProjectId","dataset":"reusedDataset"})',
          'Ids not found in ["{"projectId":"testProjectId","dataset":"testDataset"}","{"projectId":"testProjectId","dataset":"reusedDataset"}"]:',
          '- _.schemas.testWorkspace',
          '- _.schemas.testWorkspace3',
        ].join('\n'),
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should be log throwing delete operations', async () => {
    const flags: DeleteSchemaFlags = {
      ids: validStoredSchema1._id,
    }

    const context = {
      ...defaultContext,
      apiClient: () =>
        createMockSanityClient(
          {...testWorkspace, mockStores},
          {
            delete: async () => {
              throw new Error('delete error')
            },
          },
        ).client,
    }
    const status = await deleteSchemaAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Failed to delete schema "_.schemas.testWorkspace" in "{"projectId":"testProjectId","dataset":"testDataset"}":\n' +
          'delete error',
      },
      {
        error: [
          'Deleted 0/1 schemas.',
          'Failed to delete ids:',
          '- _.schemas.testWorkspace',
          'Check logs for errors.',
        ].join('\n'),
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should log mixed error, notfound, success results', async () => {
    let lastCreateClient: SanityClient = defaultContext.apiClient()
    const clientOverrides: any = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      withConfig: (newConfig: any) => {
        lastCreateClient = createMockSanityClient(
          {...testWorkspace, ...newConfig},
          clientOverrides,
        ).client
        return lastCreateClient
      },
      getDocument: async (id: string) => {
        if (id === validStoredSchema2._id) {
          throw new Error('delete error')
        }
        return mockStores[getMockStoreKey(lastCreateClient.config())]?.[id]
      },
      delete: (async (id: string) => {
        if (id === validStoredSchema2._id) {
          throw new Error('delete error')
        }
        const storeKey = getMockStoreKey(lastCreateClient.config())
        const datasetStore = mockStores[storeKey] ?? {}
        const doc = datasetStore[id]
        delete datasetStore[id]
        mockStores[storeKey] = datasetStore
        return {results: doc ? [doc] : []}
      }) as any,
    }

    await lastCreateClient
      .withConfig({dataset: workspace3.dataset})
      .createOrReplace(validStoredSchema3)

    const context = {
      ...defaultContext,
      apiClient: () => createMockSanityClient({...testWorkspace}, clientOverrides).client,
    }
    const flags: DeleteSchemaFlags = {
      ids: [
        validStoredSchema1,
        validStoredSchema2,
        validStoredSchema3,
        {_id: `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.nowhere`},
      ]
        .map((s) => s._id)
        .join(','),
    }
    const status = await deleteSchemaAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Failed to delete schema "_.schemas.testWorkspace2" in "{"projectId":"testProjectId","dataset":"testDataset"}":\n' +
          'delete error',
      },
      {
        error:
          'Failed to delete schema "_.schemas.testWorkspace2" in "{"projectId":"testProjectId","dataset":"reusedDataset"}":\n' +
          'delete error',
      },
      {
        error: [
          'Deleted 2/4 schemas.',
          'Successfully deleted ids:',
          '- _.schemas.testWorkspace (in {"projectId":"testProjectId","dataset":"testDataset"})',
          '- _.schemas.testWorkspace3 (in {"projectId":"testProjectId","dataset":"reusedDataset"})',
          'Ids not found in ["{"projectId":"testProjectId","dataset":"testDataset"}","{"projectId":"testProjectId","dataset":"reusedDataset"}"]:',
          '- _.schemas.nowhere',
          'Failed to delete ids:',
          '- _.schemas.testWorkspace2',
          'Check logs for errors.',
        ].join('\n'),
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should not generate manifest when --no-extract-manifest is provided', async () => {
    // we just have to trust that --no-extract-manifest actually is passed as false :D
    const flags: DeleteSchemaFlags = {'ids': validStoredSchema2._id, 'extract-manifest': false}
    const status = await deleteSchemaAction(flags, defaultContext)

    expect(log).toEqual([
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {success: 'Successfully deleted 1/1 schemas'},
    ])
    expect(status).toEqual('success')
  })
})
