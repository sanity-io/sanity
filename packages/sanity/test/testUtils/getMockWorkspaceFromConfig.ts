import type {SanityClient} from '@sanity/client'
import type {CurrentUser} from '@sanity/types'
import {
  createWorkspaceFromConfig,
  SchemaPluginOptions,
  SingleWorkspace,
  Source,
  Workspace,
  WorkspaceSummary,
} from '../../src/core/config'
import {createMockSanityClient} from '../mocks/mockSanityClient'
import {studioTheme} from '@sanity/ui'

const defaultMockUser: CurrentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  role: 'admin',
  roles: [{name: 'administrator', title: 'Administrator'}],
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

const defaultMockConfig: SingleWorkspace = {
  projectId: 'mock-project-id',
  dataset: 'mock-data-set',
  schema: defaultMockSchema,
}

export interface MockWorkspaceOptions {
  config?: Partial<SingleWorkspace>
  client?: SanityClient
  currentUser?: CurrentUser
}

export function getMockWorkspace({
  config: userConfig,
  currentUser = defaultMockUser,
  client = createMockSanityClient() as any as SanityClient,
}: MockWorkspaceOptions = {}): Promise<Workspace> {
  const getClient = () => client
  return createWorkspaceFromConfig({...defaultMockConfig, ...userConfig, currentUser, getClient})
}

export async function getMockSource(options: MockWorkspaceOptions = {}): Promise<Source> {
  const workspace = await getMockWorkspace(options)
  return workspace.unstable_sources[0]
}
