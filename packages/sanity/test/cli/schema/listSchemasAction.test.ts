import {type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MANIFEST_FILENAME} from '../../../src/_internal/cli/actions/manifest/extractManifestAction'
import {
  listSchemasAction,
  type SchemaListFlags,
} from '../../../src/_internal/cli/actions/schema/listSchemasAction'
import {type SchemaStoreContext} from '../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {getWorkspaceSchemaId} from '../../../src/_internal/cli/actions/schema/utils/workspaceSchemaId'
import {type StoredWorkspaceSchema} from '../../../src/_internal/manifest/manifestTypes'
import {createSchemaStoreFixture} from './mocks/schemaStoreFixture'
import {createMockJsonReader, createMockSchemaStoreContext} from './mocks/schemaStoreMocks'

const fixture = createSchemaStoreFixture(new Date().toISOString())
const {
  files,
  testSchema,
  testManifest,
  testWorkspace,
  testMultiWorkspaceManifest,
  staticDate,
  workDir,
} = fixture

const workspace1 = testMultiWorkspaceManifest.workspaces[0]
const workspace2 = testMultiWorkspaceManifest.workspaces[1]
const workspace3 = testMultiWorkspaceManifest.workspaces[2]

const validStoredSchema1: StoredWorkspaceSchema = {
  _id: getWorkspaceSchemaId({workspaceName: workspace1.name}).safeId,
  _type: 'sanity.workspace.schema',
  workspace: workspace1,
  schema: JSON.stringify(testSchema),
  _createdAt: staticDate,
}
const validStoredSchema2: StoredWorkspaceSchema = {
  ...validStoredSchema1,
  _id: getWorkspaceSchemaId({workspaceName: workspace2.name}).safeId,
  workspace: workspace2,
}
const validStoredSchema3: StoredWorkspaceSchema = {
  ...validStoredSchema1,
  _id: getWorkspaceSchemaId({workspaceName: workspace3.name}).safeId,
  workspace: workspace3,
}

const linesWithPrint = (logged: any[]) => logged.map((line) => 'print' in line && line.print)

describe('deleteSchemasAction', () => {
  let defaultContext: SchemaStoreContext
  let log: any[]
  //dataset -> id -> schema
  let mockStores: Record<string, Record<string, SanityDocumentLike | undefined>> = {}

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

    defaultContext = context
    log = outputLog
  })

  it('should list schemas ', async () => {
    const flags: SchemaListFlags = {}
    const status = await listSchemasAction(flags, defaultContext)

    const printLines = linesWithPrint(log)
    expect(printLines).toEqual([
      'Logging mock: generate manifest to "/path/to/workdir/dist/static"',
      `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      'Id                                       Workspace        Dataset         ProjectId       CreatedAt               ',
      `sanity.workspace.schema.testWorkspace3   testWorkspace3   reusedDataset   testProjectId   ${staticDate}`,
      `sanity.workspace.schema.testWorkspace2   testWorkspace2   reusedDataset   testProjectId   ${staticDate}`,
      `sanity.workspace.schema.testWorkspace    testWorkspace    testDataset     testProjectId   ${staticDate}`,
    ])
    expect(log.length, `Wrong number of lines:\n${JSON.stringify(log, null, 2)}`).toEqual(
      printLines.length,
    )
    expect(status).toEqual('success')
  })

  it('should log which datasets where searched when no schema found', async () => {
    delete mockStores[workspace1.dataset]
    delete mockStores[workspace2.dataset]
    delete mockStores[workspace3.dataset]

    const flags: SchemaListFlags = {}
    const status = await listSchemasAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {error: 'No schemas found in datasets ["testDataset","reusedDataset"]'},
    ])
    expect(status).toEqual('failure')
  })

  it('should list document matching --id ', async () => {
    const flags: SchemaListFlags = {id: validStoredSchema1._id}
    const status = await listSchemasAction(flags, defaultContext)

    expect(linesWithPrint(log)).toEqual([
      'Logging mock: generate manifest to "/path/to/workdir/dist/static"',
      `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      'Id                                      Workspace       Dataset       ProjectId       CreatedAt               ',
      `sanity.workspace.schema.testWorkspace   testWorkspace   testDataset   testProjectId   ${staticDate}`,
    ])
    expect(status).toEqual('success')
  })

  it('should throw on invalid --id ', async () => {
    const flags: SchemaListFlags = {id: 'invalid-id'}
    await expect(() => listSchemasAction(flags, defaultContext)).rejects.toThrowError(
      'Invalid arguments:\n  - id must end with sanity.workspace.schema.<workspaceName> but found: "invalid-id"',
    )
  })

  it('should output json array when --json', async () => {
    const flags: SchemaListFlags = {json: true}
    const status = await listSchemasAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        print: JSON.stringify(
          [validStoredSchema1, validStoredSchema2, validStoredSchema3],
          null,
          2,
        ),
      },
    ])
    expect(status).toEqual('success')
  })

  it('should output json object when --json & --id', async () => {
    const flags: SchemaListFlags = {json: true, id: validStoredSchema1._id}
    const status = await listSchemasAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {print: JSON.stringify(validStoredSchema1, null, 2)},
    ])
    expect(status).toEqual('success')
  })

  it('should log error when --id document does not exists, multiple datasets', async () => {
    delete mockStores[workspace1.dataset]

    const flags: SchemaListFlags = {id: validStoredSchema1._id}
    const status = await listSchemasAction(flags, defaultContext)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Schema for id "sanity.workspace.schema.testWorkspace" not found in datasets ["testDataset","reusedDataset"]',
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should log error when --id document does not exists, singular dataset', async () => {
    delete mockStores[workspace1.dataset]

    const flags: SchemaListFlags = {id: validStoredSchema1._id}
    const context = {
      ...defaultContext,
      jsonReader: createMockJsonReader({
        staticDate,
        files: {
          ...files,
          [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testManifest,
        },
      }),
    }

    const status = await listSchemasAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error:
          'Schema for id "sanity.workspace.schema.testWorkspace" not found in dataset "testDataset"',
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should handle error for --id and not repeat datasets in errors', async () => {
    const flags: SchemaListFlags = {id: validStoredSchema1._id}
    const context = {
      ...defaultContext,
      apiClient: () =>
        ({
          config: () => testWorkspace,
          withConfig: vi.fn().mockReturnThis(),
          getDocument: () => {
            throw new Error('getDocument error')
          },
        }) as unknown as SanityClient,
    }

    const status = await listSchemasAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        error: `↳ Failed to fetch schema from dataset "${workspace1.dataset}":\n  getDocument error`,
      },
      {
        error: `↳ Failed to fetch schema from dataset "${workspace2.dataset}":\n  getDocument error`,
      },
      {
        error:
          'Schema for id "sanity.workspace.schema.testWorkspace" not found in datasets ["testDataset","reusedDataset"]',
      },
    ])
    expect(status).toEqual('failure')
  })

  it('should identify dataset in fetch error in single workspace manifest', async () => {
    const flags: SchemaListFlags = {}
    const context = {
      ...defaultContext,
      jsonReader: createMockJsonReader({
        staticDate,
        files: {
          ...files,
          [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testManifest,
        },
      }),
      apiClient: () =>
        ({
          config: () => testWorkspace,
          withConfig: vi.fn().mockReturnThis(),
          fetch: () => {
            throw new Error('fetch error')
          },
        }) as unknown as SanityClient,
    }

    const status = await listSchemasAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {error: `↳ Failed to fetch schema from dataset "${workspace1.dataset}":\n  fetch error`},
      {error: 'No schemas found in dataset "testDataset"'},
    ])
    expect(status).toEqual('failure')
  })

  it('should identify all dataset in fetch error', async () => {
    const flags: SchemaListFlags = {}
    const context = {
      ...defaultContext,
      jsonReader: createMockJsonReader({
        staticDate,
        files: {
          [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testMultiWorkspaceManifest,
        },
        fallbackReader: defaultContext.jsonReader,
      }),
      apiClient: () =>
        ({
          config: () => testWorkspace,
          withConfig: vi.fn().mockReturnThis(),
          fetch: () => {
            throw new Error('fetch error')
          },
        }) as unknown as SanityClient,
    }

    const status = await listSchemasAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {error: `↳ Failed to fetch schema from dataset "${workspace1.dataset}":\n  fetch error`},
      {error: `↳ Failed to fetch schema from dataset "${workspace2.dataset}":\n  fetch error`},
      {error: 'No schemas found in datasets ["testDataset","reusedDataset"]'},
    ])
    expect(status).toEqual('failure')
  })

  it('should log warning for non-cli project workspaces', async () => {
    const flags: SchemaListFlags = {}
    const context = {
      ...defaultContext,
      jsonReader: createMockJsonReader({
        staticDate,
        files: {
          [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: {
            ...testManifest,
            workspaces: [
              {
                ...testWorkspace,
                basePath: '/workspace1',
              },
              {
                ...testWorkspace,
                projectId: 'otherProject',
                basePath: '/workspace2',
              },
            ],
          },
        },
        fallbackReader: defaultContext.jsonReader,
      }),
    }

    const status = await listSchemasAction(flags, context)

    expect(log).toEqual([
      {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
      {
        print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      },
      {
        warn: 'No permissions to read schema for workspace "testWorkspace" with projectId "otherProject" – ignoring it.',
      },
      {
        print:
          'Id                                      Workspace       Dataset       ProjectId       CreatedAt               ',
      },
      {
        print: `sanity.workspace.schema.testWorkspace   testWorkspace   testDataset   testProjectId   ${staticDate}`,
      },
    ])
    expect(status).toEqual('success')
  })

  it('should not generate manifest when --no-extract-manifest is provided', async () => {
    // we just have to trust that --no-extract-manifest actually is passed as false :D
    const flags: SchemaListFlags = {'id': validStoredSchema1._id, 'extract-manifest': false}
    const status = await listSchemasAction(flags, defaultContext)

    expect(linesWithPrint(log)).toEqual([
      `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
      'Id                                      Workspace       Dataset       ProjectId       CreatedAt               ',
      `sanity.workspace.schema.testWorkspace   testWorkspace   testDataset   testProjectId   ${staticDate}`,
    ])
    expect(status).toEqual('success')
  })
})
