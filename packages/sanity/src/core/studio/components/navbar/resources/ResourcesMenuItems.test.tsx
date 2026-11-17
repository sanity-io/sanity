import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {type ObservablePromise, preloadObservablePromise} from 'react-rx'
import {of, Subject} from 'rxjs'
import semver from 'semver'
import {describe, expect, it, vi} from 'vitest'

import {type ResourcesResponse} from './helper-functions/types'
import {ResourcesMenuItems} from './ResourcesMenuItems'

const {LoadingBlock} = vi.hoisted(() => ({
  // A mock component records its renders, so a test can tell "settled in one pass" from
  // "suspended first"
  LoadingBlock: vi.fn(() => <div data-testid="loading-block" />),
}))

vi.mock('../../../../components/loadingBlock/LoadingBlock', () => ({LoadingBlock}))
vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../../../hooks/useEnvAwareSanityWebsiteUrl', () => ({
  useEnvAwareSanityWebsiteUrl: () => 'https://www.sanity.io',
}))
vi.mock('../../../workspaces/useWorkspaces', () => ({useWorkspaces: () => []}))
vi.mock('../../../../store/datastores', () => ({
  useProjectStore: () => ({getGrants: () => of([])}),
}))

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>
      <Menu>{children}</Menu>
    </LayerProvider>
  </ThemeProvider>
)

const response: ResourcesResponse = {
  resources: {
    sectionArray: [
      {
        _key: 'learn',
        items: [
          {_key: 'docs', _type: 'externalLink', title: 'Documentation', url: 'https://docs'},
          {_key: 'guides', _type: 'externalLink', title: 'Guides', url: 'https://guides'},
        ],
      },
      {
        _key: 'community',
        items: [{_key: 'slack', _type: 'externalLink', title: 'Slack', url: 'https://slack'}],
      },
    ],
  },
}

async function renderMenuItems(resourcesPromise: ObservablePromise<ResourcesResponse | undefined>) {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the menu tree is big enough for React to yield mid-render, and a sync act then reports the use() read as an unflushed suspension even when the promise is settled
  await act(async () => {
    render(
      <ResourcesMenuItems
        currentVersion={semver.parse('3.0.0')!}
        resourcesPromise={resourcesPromise}
        onOpenStudioVersionDialog={() => {}}
      />,
      {wrapper},
    )
  })
}

const precedes = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('ResourcesMenuItems', () => {
  it('renders the studio version row at once and holds only the help sections while /help is pending', async () => {
    const response$ = new Subject<ResourcesResponse | undefined>()

    await renderMenuItems(preloadObservablePromise(response$))
    const versionRow = screen.getByTestId('menu-item-studio-version')
    const loadingBlock = screen.getByTestId('loading-block')
    const [divider] = screen.getAllByRole('separator')
    // The boundary sits below the version row and the divider, so only the sections slot waits
    expect(precedes(versionRow, divider)).toBe(true)
    expect(precedes(divider, loadingBlock)).toBe(true)
    expect(screen.queryByText('Documentation')).not.toBeInTheDocument()

    await act(async () => response$.next(response))
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('Guides')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
    expect(screen.queryByText('help-resources.action.help-and-support')).not.toBeInTheDocument()
  })

  it('renders settled help sections in one pass, without a loading block', async () => {
    await renderMenuItems(preloadObservablePromise(of<ResourcesResponse | undefined>(response)))

    expect(LoadingBlock).not.toHaveBeenCalled()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
  })

  it('renders the static fallback links when the request failed', async () => {
    await renderMenuItems(preloadObservablePromise(of<ResourcesResponse | undefined>(undefined)))

    expect(LoadingBlock).not.toHaveBeenCalled()
    expect(screen.getByText('help-resources.action.join-our-community')).toBeInTheDocument()
    expect(screen.getByText('help-resources.action.help-and-support')).toBeInTheDocument()
    expect(screen.getByText('help-resources.action.contact-sales')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
  })
})
