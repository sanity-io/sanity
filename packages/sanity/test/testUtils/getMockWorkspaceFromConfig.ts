import type {SanityClient} from '@sanity/client'
import type {CurrentUser} from '@sanity/types'
import {
  createWorkspaceFromConfig,
  SchemaPluginOptions,
  SingleWorkspace,
  Source,
  Workspace,
} from '../../src/config'
import {createMockSanityClient} from '../mocks/mockSanityClient'

const defaultMockUser: CurrentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  role: 'admin',
  roles: [{name: 'admin', title: 'Admin'}],
}

const defaultMockConfig: SingleWorkspace = {
  projectId: 'mock-project-id',
  dataset: 'mock-data-set',
}

const defaultMockSchema: SchemaPluginOptions = {
  name: 'mock',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
      ],
    },
  ],
}

export interface MockWorkspaceOptions {
  config?: SingleWorkspace
  client?: SanityClient
  schema?: SchemaPluginOptions
  currentUser?: CurrentUser
}

export function getMockWorkspace({
  config = defaultMockConfig,
  currentUser = defaultMockUser,
  client = createMockSanityClient() as any as SanityClient,
  schema = defaultMockSchema,
}: MockWorkspaceOptions = {}): Promise<Workspace> {
  return createWorkspaceFromConfig({...config, currentUser, client, schema})
}

export async function getMockSource(options: MockWorkspaceOptions = {}): Promise<Source> {
  const workspace = await getMockWorkspace(options)
  return workspace.unstable_sources[0]
}
