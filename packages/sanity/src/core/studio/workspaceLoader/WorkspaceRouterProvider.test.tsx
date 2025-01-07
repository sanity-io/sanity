import {type SanityClient} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type Workspace} from '../../config/types'
import {WorkspaceRouterProvider} from './WorkspaceRouterProvider'

vi.mock('../router/RouterHistoryContext', () => ({
  useRouterHistory: () => ({
    location: {pathname: '/'},
    listen: vi.fn(),
  }),
}))

vi.mock('../router', () => ({
  createRouter: () => ({
    getBasePath: vi.fn(),
    decode: vi.fn(),
    isNotFound: vi.fn(),
  }),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  RouterProvider: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  IntentLink: () => <div>IntentLink</div>,
}))

vi.mock('./WorkspaceRouterProvider', async () => ({
  ...(await vi.importActual('./WorkspaceRouterProvider')),
  useRouterFromWorkspaceHistory: vi.fn(),
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
    getClient: vi.fn(),
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

  it('calls onUncaughtError when an error is caught', async () => {
    const onUncaughtError = vi.fn()

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
        onUncaughtError,
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
      expect(onUncaughtError).toHaveBeenCalledTimes(1)
    }
  })
})
