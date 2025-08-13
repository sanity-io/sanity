import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'

import {createWorkspaceFromConfig} from '../../src/core/config'
import {
  type SchemaPluginOptions,
  type SingleWorkspace,
  type Source,
  type Workspace,
} from '../../src/core/config/types'
import {createMockSanityClient} from '../mocks/mockSanityClient'

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
  scheduledPublishing: {enabled: false},
  releases: {enabled: true},
  mediaLibrary: {enabled: true},
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
