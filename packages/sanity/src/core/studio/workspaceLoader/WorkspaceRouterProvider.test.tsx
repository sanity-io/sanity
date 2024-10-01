import {describe, expect, it, jest} from '@jest/globals'
import {ErrorBoundary, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'

import {LocaleProviderBase, usEnglishLocale} from '../../i18n'
import {prepareI18n} from '../../i18n/i18nConfig'
import {useSource} from '../source'
import {WorkspaceRouterProvider} from './WorkspaceRouterProvider'

jest.mock('../router/RouterHistoryContext', () => ({
  useRouterHistory: () => ({
    location: {pathname: '/'},
    listen: jest.fn(),
  }),
}))

jest.mock('../source', () => ({
  useSource: jest.fn(),
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

const useSourceMock = useSource as jest.Mock

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

  it('calls onStudioError when an error is caught', () => {
    const onStudioError = jest.fn()
    useSourceMock.mockReturnValue({onStudioError})

    const ThrowErrorComponent = () => {
      throw new Error('An EXPECTED, testing error occurred!')
    }

    const locales = [usEnglishLocale]
    const {i18next} = prepareI18n({
      projectId: 'test',
      dataset: 'test',
      name: 'test',
    })

    render(
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase
          projectId={'test'}
          sourceId={'test'}
          locales={locales}
          i18next={i18next}
        >
          {/* prevents thrown error from breaking the test */}
          <ErrorBoundary onCatch={({error, info}) => <></>}>
            <WorkspaceRouterProvider LoadingComponent={LoadingComponent} workspace={workspace}>
              <ThrowErrorComponent />
            </WorkspaceRouterProvider>
          </ErrorBoundary>
        </LocaleProviderBase>
      </ThemeProvider>,
    )

    expect(onStudioError).toHaveBeenCalledTimes(1)
  })
})
