import {type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MANIFEST_FILENAME} from '../../../src/_internal/cli/actions/manifest/extractManifestAction'
import {
  deploySchemasAction,
  type DeploySchemasFlags,
} from '../../../src/_internal/cli/actions/schema/deploySchemasAction'
import {type SchemaStoreContext} from '../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {
  type DefaultWorkspaceSchemaId,
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
} from '../../../src/_internal/manifest/manifestTypes'
import {createSchemaStoreFixture} from './mocks/schemaStoreFixture'
import {
  createMockJsonReader,
  createMockSanityClient,
  createMockSchemaStoreContext,
} from './mocks/schemaStoreMocks'

const fixture = createSchemaStoreFixture(new Date().toISOString())
const {testManifest, testSchema, testWorkspace, testMultiWorkspaceManifest, staticDate, workDir} =
  fixture

describe('deploySchemasAction', () => {
  let defaultContext: SchemaStoreContext
  let mockSanityClient: SanityClient
  let mockStores: Record<string, Record<string, SanityDocumentLike | undefined>>
  let log: any[]

  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    const {context, outputLog, apiClient, mockStores: store} = createMockSchemaStoreContext(fixture)
    defaultContext = context
    log = outputLog
    mockSanityClient = apiClient
    mockStores = store
  })

  describe('basic functionality', () => {
    it('should deploy all schemas when no flags are provided', async () => {
      const flags: DeploySchemasFlags = {}
      const status = await deploySchemasAction(flags, defaultContext)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Deployed 1/1 schemas'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      const storedSchema = await mockSanityClient.getDocument(
        `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${testWorkspace.name}` satisfies DefaultWorkspaceSchemaId,
      )
      expect(storedSchema).toEqual({
        _id: '_.schemas.testWorkspace',
        _type: 'system.schema',
        //this will be stringified by the api
        schema: testSchema,
        version: '2025-05-01',
        workspace: {name: testWorkspace.name},
      })
      expect(status).toEqual('success')
    })

    it('should handle multiple workspaces', async () => {
      const flags: DeploySchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {[`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testMultiWorkspaceManifest},
          fallbackReader: defaultContext.jsonReader,
        }),
      }

      const status = await deploySchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Deployed 3/3 schemas'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])

      const docs = await Promise.all(
        testMultiWorkspaceManifest.workspaces.map((workspace) => {
          return mockSanityClient
            .withConfig({
              dataset: workspace.dataset,
            })
            .getDocument(
              `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${workspace.name}` satisfies DefaultWorkspaceSchemaId,
            )
        }),
      )
      expect(docs).toEqual([
        {
          _id: '_.schemas.testWorkspace',
          _type: 'system.schema',
          //this will be stringified by the api
          schema: testSchema,
          version: '2025-05-01',
          workspace: {name: 'testWorkspace'},
        },
        {
          _id: '_.schemas.testWorkspace2',
          _type: 'system.schema',
          //this will be stringified by the api
          schema: testSchema,
          version: '2025-05-01',
          workspace: {name: 'testWorkspace2'},
        },
        {
          _id: '_.schemas.testWorkspace3',
          _type: 'system.schema',
          //this will be stringified by the api
          schema: testSchema,
          version: '2025-05-01',
          workspace: {name: 'testWorkspace3'},
        },
      ])
      expect(status).toEqual('success')
    })

    it('should replace _id-incompatible characters in deployed schema id, and warn', async () => {
      const flags: DeploySchemasFlags = {}
      const workspaceName = 'workspace .%&/'
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {
            [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: {
              ...testManifest,
              workspaces: [{...testWorkspace, name: workspaceName}],
            },
          },
          fallbackReader: defaultContext.jsonReader,
        }),
      }

      const status = await deploySchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {
          // if this happens – rename your workspaces, folks
          warn: [
            `Workspace "${workspaceName}" contains characters unsupported by schema _id [a-zA-Z0-9_-], they will be replaced with _.`,
            'This could lead duplicate schema ids: consider renaming your workspace.',
          ].join('\n'),
        },
        {success: 'Deployed 1/1 schemas'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])

      const storedSchema = await mockSanityClient.getDocument(
        '_.schemas.workspace_____' satisfies DefaultWorkspaceSchemaId,
      )
      expect(storedSchema).toEqual({
        _id: '_.schemas.workspace_____',
        _type: 'system.schema',
        //this will be stringified by the api
        schema: testSchema,
        version: '2025-05-01',
        workspace: {name: workspaceName},
      })
      expect(status).toEqual('success')
    })
  })

  describe('flag handling', () => {
    it('should require non-empty tag when specified', async () => {
      await expect(() => deploySchemasAction({tag: ''}, defaultContext)).rejects.toThrowError(
        'Invalid arguments:\n  - tag argument is empty',
      )
    })

    it('should require tag without .', async () => {
      await expect(() =>
        deploySchemasAction({tag: 'invalid.'}, defaultContext),
      ).rejects.toThrowError(
        'Invalid arguments:\n  - tag cannot contain . (period), but was: "invalid."',
      )
    })

    it('should require tag with only id compatible characters', async () => {
      await expect(() => deploySchemasAction({tag: '%/()#'}, defaultContext)).rejects.toThrowError(
        'Invalid arguments:\n  - tag can only contain characters in [a-zA-Z0-9_-], but was: "%/()#',
      )
    })

    it('should add tag when specified', async () => {
      const status = await deploySchemasAction({tag: 'test-tag'}, defaultContext)
      const storedSchema = await mockSanityClient.getDocument(
        '_.schemas.testWorkspace.tag.test-tag',
      )
      expect(storedSchema).toEqual({
        _id: '_.schemas.testWorkspace.tag.test-tag',
        _type: 'system.schema',
        schema: testSchema,
        tag: 'test-tag',
        version: '2025-05-01',
        workspace: {
          name: 'testWorkspace',
        },
      })
      expect(status).toEqual('success')
    })

    it('should require non-empty manifest-dir when specified', async () => {
      await expect(() =>
        deploySchemasAction({'manifest-dir': ''}, defaultContext),
      ).rejects.toThrowError('Invalid arguments:\n  - manifest-dir argument is empty')
    })

    it('should require non-empty workspace when specified', async () => {
      await expect(() => deploySchemasAction({workspace: ''}, defaultContext)).rejects.toThrowError(
        'Invalid arguments:\n  - workspace argument is empty',
      )
    })

    it('should handle verbose output mode', async () => {
      const status = await deploySchemasAction({verbose: true}, defaultContext)
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {
          print:
            '↳ schemaId: _.schemas.testWorkspace, projectId: testProjectId, dataset: testDataset',
        },
        {success: 'Deployed 1/1 schemas'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('success')
    })
  })

  describe('error handling', () => {
    it('should log on missing schema file, but not throw by default', async () => {
      const flags: DeploySchemasFlags = {'schema-required': true}
      const context = {
        ...defaultContext,
        jsonReader: async () => {
          throw Error('no json for you')
        },
      }
      await expect(() => deploySchemasAction(flags, context)).rejects.toThrow('no json for you')

      //we dont expect the error to be part of the intercepted logs, since the error is thrown
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
    })

    it('should throw on failing deploy (any reason) when schema required', async () => {
      const flags: DeploySchemasFlags = {'schema-required': true}
      const context: SchemaStoreContext = {
        ...defaultContext,
        apiClient: () =>
          createMockSanityClient(testWorkspace, {
            createOrReplace: () => {
              throw new Error('createOrReplace error')
            },
          }).client,
      }

      await expect(() => deploySchemasAction(flags, context)).rejects.toThrow(
        'Failed to deploy 1/1 schemas. Successfully deployed 0/1 schemas.',
      )

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {error: '↳ Error deploying schema for workspace "testWorkspace":\n  createOrReplace error'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
    })

    it('should throw on invalid workspace name', async () => {
      await expect(() =>
        deploySchemasAction({workspace: 'invalidWorkspace'}, defaultContext),
      ).rejects.toThrow('Found no workspaces named "invalidWorkspace"')

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
    })

    it('should log on invalid schema JSON by default', async () => {
      const flags = {}
      const context = {
        ...defaultContext,
        jsonReader: async () => {
          throw Error('no json for you')
        },
      }
      const status = await deploySchemasAction(flags, context)
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ Error when storing schemas:\n  no json for you'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should throw on invalid schema JSON when schema required', async () => {
      const flags: DeploySchemasFlags = {'schema-required': true}
      const context = {
        ...defaultContext,
        jsonReader: async () => {
          throw Error('no json for you')
        },
      }
      await expect(() => deploySchemasAction(flags, context)).rejects.toThrow('no json for you')

      //we dont expect the error to be part of the intercepted logs, since the error is thrown
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
    })

    it('should handle empty workspaces array', async () => {
      const flags: DeploySchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {
            [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: {
              ...testManifest,
              workspaces: [],
            },
          },
        }),
      }

      const status = await deploySchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {print: '↳ Error when storing schemas:\n  Workspace array in manifest is empty.'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should handle workspace with missing properties', async () => {
      const flags: DeploySchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {
            [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: {
              ...testManifest,
              workspaces: [{name: testWorkspace.name}],
            },
          },
          fallbackReader: defaultContext.jsonReader,
        }),
      }

      const status = await deploySchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {
          error:
            '↳ Error deploying schema for workspace "testWorkspace":\n' +
            '  Workspace schema file at "/path/to/workdir/dist/static" does not exist.',
        },
        {
          print:
            '↳ Error when storing schemas:\n' +
            '  Failed to deploy 1/1 schemas. Successfully deployed 0/1 schemas.',
        },
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })
  })

  describe('manifest handling', () => {
    it('should log on missing manifest – no manifest will be created by default', async () => {
      const flags: DeploySchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: async () => undefined,
      }

      const status = await deploySchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print:
            '↳ Error when storing schemas:\n' +
            '  Manifest does not exist at /path/to/workdir/dist/static/create-manifest.json. ' +
            'To create the manifest file, omit --no-extract-manifest or run "sanity manifest extract" first.',
        },
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should not generate manifest when --no-extract-manifest is provided', async () => {
      // we just have to trust that --no-extract-manifest actually is passed as false :D
      const flags: DeploySchemasFlags = {'extract-manifest': false}

      const status = await deploySchemasAction(flags, defaultContext)

      expect(log).toEqual([
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Deployed 1/1 schemas'},
        {print: '↳ List deployed schemas with: sanity schema list'},
      ])
      expect(status).toEqual('success')
    })

    it('should not throw if manifest extract fails by default', async () => {
      const flags: DeploySchemasFlags = {'extract-manifest': true}

      const status = await deploySchemasAction(flags, {
        ...defaultContext,
        manifestExtractor: async () => {
          throw new Error('failed to extract')
        },
      })

      expect(log).toEqual([{print: `↳ Failed to extract manifest:\n  failed to extract`}])
      expect(status).toEqual('failure')
    })

    it('should throw if manifest extract fails when --schema-required', async () => {
      const flags: DeploySchemasFlags = {'extract-manifest': true, 'schema-required': true}

      await expect(() =>
        deploySchemasAction(flags, {
          ...defaultContext,
          manifestExtractor: async () => {
            throw new Error('failed to extract')
          },
        }),
      ).rejects.toThrow('failed to extract')

      expect(log).toEqual([])
    })
  })
})
