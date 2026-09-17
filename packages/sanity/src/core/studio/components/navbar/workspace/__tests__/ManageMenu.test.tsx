import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {preloadObservablePromise} from 'react-rx'
import {of, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../../../config/types'
import {ManageMenu} from '../ManageMenu'

vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../../../../workspace', () => ({useWorkspace: () => ({projectId: 'abc123'})}))
vi.mock('../../../../hooks/useEnvAwareSanityWebsiteUrl', () => ({
  useEnvAwareSanityWebsiteUrl: () => 'https://www.sanity.io',
}))
vi.mock('../../useCanInviteMembers', () => ({useCanInviteProjectMembers: () => false}))
vi.mock('../../../../activeWorkspaceMatcher/useActiveWorkspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: {name: 'test', title: 'Test Studio'} as unknown as WorkspaceSummary,
  }),
}))

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

const projectNameSkeleton = () => document.querySelector('[data-ui="TextSkeleton"]')

describe('ManageMenu', () => {
  it('renders a settled project name on the first render, without a fallback pass', () => {
    const promise = preloadObservablePromise(of('Sanity Studio Test Data'))

    render(<ManageMenu multipleWorkspaces={false} projectNamePromise={promise} />, {wrapper})

    expect(screen.getByText('Sanity Studio Test Data')).toBeInTheDocument()
    expect(projectNameSkeleton()).toBeNull()
  })

  it('holds the name row with a skeleton until the promise settles', async () => {
    const name$ = new Subject<string | null>()
    const promise = preloadObservablePromise(name$)

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mount has to happen inside an awaited act so React can resume the suspended tree
    await act(async () => {
      render(<ManageMenu multipleWorkspaces={false} projectNamePromise={promise} />, {wrapper})
    })
    expect(projectNameSkeleton()).not.toBeNull()
    expect(screen.getByText('Test Studio')).toBeInTheDocument()
    expect(screen.queryByText('Sanity Studio Test Data')).not.toBeInTheDocument()

    await act(async () => name$.next('Sanity Studio Test Data'))
    expect(projectNameSkeleton()).toBeNull()
    expect(screen.getByText('Sanity Studio Test Data')).toBeInTheDocument()
  })

  it('renders no name row when the project name is unknown', () => {
    const promise = preloadObservablePromise(of<string | null>(null))

    render(<ManageMenu multipleWorkspaces={false} projectNamePromise={promise} />, {wrapper})

    expect(projectNameSkeleton()).toBeNull()
    expect(screen.getByText('Test Studio')).toBeInTheDocument()
  })
})
