import {describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'
import {type SanityClient, type Workspace} from 'sanity'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {WorkspaceRouterProvider} from './WorkspaceRouterProvider'

jest.mock('../router/RouterHistoryContext', () => ({
  useRouterHistory: () => ({
    location: {pathname: '/'},
    listen: jest.fn(),
  }),
}))

jest.mock('../router', () => ({
  createRouter: () => ({
    getBasePath: jest.fn(),
    decode: jest.fn(),
    isNotFound: jest.fn(),
  }),
}))

jest.mock('sanity/router', () => ({
  RouterProvider: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  IntentLink: () => <div>IntentLink</div>,
}))

jest.mock('./WorkspaceRouterProvider', () => ({
  ...(jest.requireActual('./WorkspaceRouterProvider') as object),
  useRouterFromWorkspaceHistory: jest.fn(),
}))

describe('WorkspaceRouterProvider', () => {
  const LoadingComponent = () => <div>Loading...</div>
  const children = <div>Children</div>
  const workspace = {
    basePath: '',
    tools: [],
    icon: null,
    unstable_sources: [],
    scheduledPublishing: false,
    document: {},
    form: {},
    search: {},
    title: 'Default Workspace',
    name: 'default',
    projectId: 'test',
    dataset: 'test',
    schema: {},
    templates: {},
    currentUser: {},
    authenticated: true,
    auth: {},
    getClient: jest.fn(),
    i18n: {},
    __internal: {},
    type: 'workspace',
    // Add other required properties with appropriate default values
  } as unknown as Workspace

  it('renders children when state is not null', () => {
    render(
      <WorkspaceRouterProvider LoadingComponent={LoadingComponent} workspace={workspace}>
        {children}
      </WorkspaceRouterProvider>,
    )

    expect(screen.getByText('Children')).toBeInTheDocument()
  })

  it('calls onStudioError when an error is caught', async () => {
    const onStudioError = jest.fn()

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    const client = createMockSanityClient() as unknown as SanityClient

    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        onStudioError,
      },
    })

    try {
      render(
        <TestProvider>
          {/* prevents thrown error from breaking the test */}
          <WorkspaceRouterProvider LoadingComponent={LoadingComponent} workspace={workspace}>
            <ThrowErrorComponent />
          </WorkspaceRouterProvider>
        </TestProvider>,
      )
    } catch {
      expect(onStudioError).toHaveBeenCalledTimes(1)
    }
  })
})
