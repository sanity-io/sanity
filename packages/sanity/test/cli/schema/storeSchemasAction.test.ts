import {type SanityClient} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {MANIFEST_FILENAME} from '../../../src/_internal/cli/actions/manifest/extractManifestAction'
import {type SchemaStoreContext} from '../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {
  storeSchemasAction,
  type StoreSchemasFlags,
} from '../../../src/_internal/cli/actions/schema/storeSchemasAction'
import {createSchemaStoreFixture} from './mocks/schemaStoreFixture'
import {
  createMockJsonReader,
  createMockSanityClient,
  createMockStoreSchemaContext,
} from './mocks/schemaStoreMocks'

const fixture = createSchemaStoreFixture(new Date().toISOString())
const {testManifest, testWorkspace, testMultiWorkspaceManifest, staticDate, workDir} = fixture

describe('storeSchemasAction', () => {
  let defaultContext: SchemaStoreContext
  let mockSanityClient: SanityClient
  let log: any[]

  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    const {context, outputLog, apiClient} = createMockStoreSchemaContext(fixture)
    defaultContext = context
    log = outputLog
    mockSanityClient = apiClient
  })

  describe('basic functionality', () => {
    it('should store all schemas when no flags are provided', async () => {
      const flags: StoreSchemasFlags = {}
      const status = await storeSchemasAction(flags, defaultContext)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Stored 1/1 schemas'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(mockSanityClient.createOrReplace).toHaveBeenCalled()
      expect(status).toEqual('success')
    })

    it('should handle multiple workspaces', async () => {
      const flags: StoreSchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {[`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testMultiWorkspaceManifest},
          fallbackReader: defaultContext.jsonReader,
        }),
      }

      const status = await storeSchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Stored 3/3 schemas'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(mockSanityClient.createOrReplace).toHaveBeenCalledTimes(3)
      expect(status).toEqual('success')
    })

    it('should replace _id-incompatible characters in stored schema id, and warn', async () => {
      const flags: StoreSchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: createMockJsonReader({
          staticDate,
          files: {
            [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: {
              ...testManifest,
              workspaces: [{...testWorkspace, name: 'workspace%&/'}],
            },
          },
          fallbackReader: defaultContext.jsonReader,
        }),
      }

      const status = await storeSchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },

        {
          // if this happens – rename your workspaces, folks
          warn: [
            'Workspace "workspace%&/" contains characters unsupported by schema _id [a-zA-Z0-9._-], they will be replaced with _.',
            'This could lead duplicate schema ids: consider renaming your workspace.',
          ].join('\n'),
        },
        {success: 'Stored 1/1 schemas'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(mockSanityClient.createOrReplace).toHaveBeenCalledWith(
        // Known caveat: this can lead to schemas with identical ids

        expect.objectContaining({_id: 'sanity.workspace.schema.workspace___'}),
      )
      expect(status).toEqual('success')
    })
  })

  describe('flag handling', () => {
    it('should require non-empty id-prefix when specified', async () => {
      await expect(() =>
        storeSchemasAction({'id-prefix': ''}, defaultContext),
      ).rejects.toThrowError('Invalid arguments:\n  - id-prefix argument is empty')
    })

    it('should require id-prefix without . suffix', async () => {
      await expect(() =>
        storeSchemasAction({'id-prefix': 'invalid.'}, defaultContext),
      ).rejects.toThrowError(
        'Invalid arguments:\n  - idx-prefix argument cannot end with . (period), but was invalid.',
      )
    })

    it('should require id-prefix with only id compatible characters', async () => {
      await expect(() =>
        storeSchemasAction({'id-prefix': '%/()#'}, defaultContext),
      ).rejects.toThrowError(
        'Invalid arguments:\n  - idx-prefix can only contain _id compatible characters [a-zA-Z0-9._-], but was %/()#',
      )
    })

    it('should add id-prefix when specified', async () => {
      const status = await storeSchemasAction({'id-prefix': 'test-prefix'}, defaultContext)
      expect(mockSanityClient.createOrReplace).toHaveBeenCalledWith(
        expect.objectContaining({_id: 'test-prefix.sanity.workspace.schema.testWorkspace'}),
      )
      expect(status).toEqual('success')
    })

    it('should require non-empty manifest-dir when specified', async () => {
      await expect(() =>
        storeSchemasAction({'manifest-dir': ''}, defaultContext),
      ).rejects.toThrowError('Invalid arguments:\n  - manifest-dir argument is empty')
    })

    it('should require non-empty workspace when specified', async () => {
      await expect(() => storeSchemasAction({workspace: ''}, defaultContext)).rejects.toThrowError(
        'Invalid arguments:\n  - workspace argument is empty',
      )
    })

    it('should handle verbose output mode', async () => {
      const status = await storeSchemasAction({verbose: true}, defaultContext)
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {
          print:
            '↳ schemaId: sanity.workspace.schema.testWorkspace, projectId: testProjectId, dataset: testDataset',
        },
        {success: 'Stored 1/1 schemas'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('success')
    })
  })

  describe('error handling', () => {
    it('should log on missing schema file, but not throw by default', async () => {
      const flags: StoreSchemasFlags = {'schema-required': true}
      const context = {
        ...defaultContext,
        jsonReader: async () => {
          throw Error('no json for you')
        },
      }
      await expect(() => storeSchemasAction(flags, context)).rejects.toThrow('no json for you')

      //we dont expect the error to be part of the intercepted logs, since the error is thrown
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
    })

    it('should throw on failing store (any reason) when schema required', async () => {
      const flags: StoreSchemasFlags = {'schema-required': true}
      const context: SchemaStoreContext = {
        ...defaultContext,
        apiClient: () =>
          createMockSanityClient(testWorkspace, {
            createOrReplace: () => {
              throw new Error('createOrReplace error')
            },
          }).client,
      }

      await expect(() => storeSchemasAction(flags, context)).rejects.toThrow(
        'Failed to store 1/1 schemas. Successfully stored 0/1 schemas.',
      )

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {error: '↳ Error storing schema for workspace "testWorkspace":\n  createOrReplace error'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
    })

    it('should throw on invalid workspace name', async () => {
      await expect(() =>
        storeSchemasAction({workspace: 'invalidWorkspace'}, defaultContext),
      ).rejects.toThrow('Found no workspaces named "invalidWorkspace"')

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {print: '↳ List stored schemas with: sanity schema list'},
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
      const status = await storeSchemasAction(flags, context)
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ Error when storing schemas:\n  no json for you'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should throw on invalid schema JSON when schema required', async () => {
      const flags: StoreSchemasFlags = {'schema-required': true}
      const context = {
        ...defaultContext,
        jsonReader: async () => {
          throw Error('no json for you')
        },
      }
      await expect(() => storeSchemasAction(flags, context)).rejects.toThrow('no json for you')

      //we dont expect the error to be part of the intercepted logs, since the error is thrown
      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
    })

    it('should handle empty workspaces array', async () => {
      const flags: StoreSchemasFlags = {}
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

      const status = await storeSchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {print: '↳ Error when storing schemas:\n  Workspace array in manifest is empty.'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should handle workspace with missing properties', async () => {
      const flags: StoreSchemasFlags = {}
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

      const status = await storeSchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {
          error:
            '↳ Error storing schema for workspace "testWorkspace":\n' +
            '  No permissions to write schema for workspace "testWorkspace" with projectId "undefined"',
        },
        {
          print:
            '↳ Error when storing schemas:\n' +
            '  Failed to store 1/1 schemas. Successfully stored 0/1 schemas.',
        },
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })
  })

  describe('manifest handling', () => {
    it('should log on missing manifest – no manifest will be created by default', async () => {
      const flags: StoreSchemasFlags = {}
      const context: SchemaStoreContext = {
        ...defaultContext,
        jsonReader: async () => undefined,
      }

      const status = await storeSchemasAction(flags, context)

      expect(log).toEqual([
        {print: 'Logging mock: generate manifest to "/path/to/workdir/dist/static"'},
        {
          print:
            '↳ Error when storing schemas:\n' +
            '  Manifest does not exist at /path/to/workdir/dist/static/create-manifest.json. ' +
            'To create the manifest file, re-run with --extract-manifest or run "sanity manifest extract"',
        },
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('failure')
    })

    it('should not generate manifest when --no-extract-manifest is provided', async () => {
      // we just have to trust that --no-extract-manifest actually is passed as false :D
      const flags: StoreSchemasFlags = {'extract-manifest': false}

      const status = await storeSchemasAction(flags, defaultContext)

      expect(log).toEqual([
        {
          print: `↳ Read manifest from /path/to/workdir/dist/static/create-manifest.json (last modified: ${staticDate})`,
        },
        {success: 'Stored 1/1 schemas'},
        {print: '↳ List stored schemas with: sanity schema list'},
      ])
      expect(status).toEqual('success')
    })

    it('should not throw if manifest extract fails by default', async () => {
      const flags: StoreSchemasFlags = {'extract-manifest': true}

      const status = await storeSchemasAction(flags, {
        ...defaultContext,
        manifestExtractor: async () => {
          throw new Error('failed to extract')
        },
      })

      expect(log).toEqual([{print: `↳ Failed to extract manifest:\n  failed to extract`}])
      expect(status).toEqual('failure')
    })

    it('should throw if manifest extract fails when --schema-required', async () => {
      const flags: StoreSchemasFlags = {'extract-manifest': true, 'schema-required': true}

      await expect(() =>
        storeSchemasAction(flags, {
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
