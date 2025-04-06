import {MANIFEST_FILENAME} from '../../../../src/_internal/cli/actions/manifest/extractManifestAction'
import {
  type CreateManifest,
  type ManifestSchemaType,
  type ManifestWorkspaceFile,
} from '../../../../src/_internal/manifest/manifestTypes'

export function createSchemaStoreFixture(staticDate: string) {
  const workDir = '/path/to/workdir'

  const testWorkspace: ManifestWorkspaceFile = {
    name: 'testWorkspace',
    projectId: 'testProjectId',
    dataset: 'testDataset',
    schema: 'testSchema.json',
    tools: 'n/a',
    icon: null,
    basePath: '/',
  }

  const testManifest: CreateManifest = {
    version: 1,
    createdAt: staticDate,
    workspaces: [testWorkspace],
  }

  const testMultiWorkspaceManifest: CreateManifest = {
    ...testManifest,
    workspaces: [
      {
        ...testWorkspace,
        basePath: '/workspace1',
      },
      //these two workspaces target the same dataset
      {
        ...testWorkspace,
        name: 'testWorkspace2',
        basePath: '/workspace2',
        dataset: 'reusedDataset',
        schema: 'testSchema2.json',
      },
      {
        ...testWorkspace,
        name: 'testWorkspace3',
        basePath: '/workspace3',
        dataset: 'reusedDataset',
        schema: 'testSchema3.json',
      },
    ],
  }

  const testSchema: ManifestSchemaType[] = [
    {
      type: 'document',
      name: 'doc',
      fields: [{type: 'string', name: 'title'}],
    },
  ]

  return {
    testManifest,
    testWorkspace,
    testMultiWorkspaceManifest,
    testSchema,
    staticDate,
    workDir,
    files: {
      [`${workDir}/dist/static/${MANIFEST_FILENAME}`]: testManifest,
      [`${workDir}/dist/static/${testWorkspace.schema}`]: testSchema,
      [`${workDir}/dist/static/${testMultiWorkspaceManifest.workspaces[1].schema}`]: testSchema,
      [`${workDir}/dist/static/${testMultiWorkspaceManifest.workspaces[2].schema}`]: testSchema,
    },
  }
}
