import {Card} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import {type ReactNode, useMemo, useState} from 'react'
import {type Observable, of} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../../config/types'
import {useClient} from '../../../../hooks/useClient'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {AppIdCacheProvider} from '../../../../store/studio-app/AppIdCacheProvider'
import {ActiveWorkspaceMatcherProvider} from '../../../../studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {createMockDocument} from '../../../__fixtures__/documentInRelease.fixture'
import {
  activeASAPErrorRelease,
  activeASAPRelease,
  activeCardinalityOneRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {RELEASE_DOCUMENT_TYPE} from '../../../store/constants'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../util/releasesClient'
import {isNotArchivedRelease} from '../../../util/util'
import {ArchivedReleaseBanner} from '../ArchivedReleaseBanner'
import {publishedReleaseEvents} from '../events/__fixtures__/release-events'
import {type ReleaseEvents} from '../events/useReleaseEvents'
import {ReleaseActivityListItem} from '../ReleaseActivityListItem'
import {ReleaseDashboardActivityPanel} from '../ReleaseDashboardActivityPanel'
import {ReleaseDashboardDetails} from '../ReleaseDashboardDetails'
import {ReleaseDashboardHeader} from '../ReleaseDashboardHeader'
import {ReleaseDetail, type ReleaseInspector} from '../ReleaseDetail'
import {ReleaseSummary} from '../ReleaseSummary'
import {ReleaseTypePicker} from '../ReleaseTypePicker'
import {type DocumentInRelease} from '../types'
import {ValidationProgressIndicator} from '../ValidationProgressIndicator'

const detailRouter = route.create('/:releaseId')

const validatingDocuments: DocumentInRelease[] = [
  {
    ...createMockDocument(),
    memoKey: 'validating',
    validation: {hasError: false, isValidating: true, validation: []},
  },
  {
    ...createMockDocument(),
    memoKey: 'validated',
    document: {...createMockDocument().document, _id: 'validated-id'},
  },
]

const publishEvent = publishedReleaseEvents[0]

const loadedEvents: ReleaseEvents = {
  events: [publishEvent],
  loading: false,
  error: null,
  loadMore: () => undefined,
  hasMore: false,
}

const failedEvents: ReleaseEvents = {
  events: [],
  loading: false,
  error: new Error('activity failed'),
  loadMore: () => undefined,
  hasMore: false,
}

function setActiveWorkspace() {
  return undefined
}

/**
 * Header copy actions and activity timestamps need the studio contexts
 * TestWrapper does not mount: locale, the app-id cache, and the active workspace.
 */
function DetailProviders({children}: {children: ReactNode}) {
  const workspace = useWorkspace()
  const history = useMemo(() => createMemoryHistory(), [])
  const activeWorkspace = {
    name: workspace.name,
    title: workspace.title,
    basePath: workspace.basePath,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
  } as WorkspaceSummary

  return (
    <LocaleProvider>
      <AppIdCacheProvider>
        <ActiveWorkspaceMatcherProvider
          activeWorkspace={activeWorkspace}
          history={history}
          setActiveWorkspace={setActiveWorkspace}
        >
          {children}
        </ActiveWorkspaceMatcherProvider>
      </AppIdCacheProvider>
    </LocaleProvider>
  )
}

function ChromeHarness({children}: {children: ReactNode}) {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <DetailProviders>
        <Card padding={4}>{children}</Card>
      </DetailProviders>
    </TestWrapper>
  )
}

function HeaderHarness() {
  const [inspector, setInspector] = useState<ReleaseInspector | undefined>(undefined)

  return (
    <ReleaseDashboardHeader
      documents={[]}
      inspector={inspector}
      release={activeASAPRelease}
      setInspector={setInspector}
    />
  )
}

interface ReleaseQueryClient {
  observable: {
    fetch: (query: string) => Observable<unknown>
    request: (options: {url?: string}) => Observable<unknown>
  }
}

/**
 * The mock client answers every query with `null`. Preview observers then call
 * `.map` / `.find` on that result and throw. List queries get an array, and
 * the releases list gets the fixture, before `ReleaseDetail` subscribes.
 */
function patchReleaseClient(client: ReleaseQueryClient) {
  const {request} = client.observable
  // List queries have to return arrays before ReleaseDetail subscribes, so this
  // runs on the render that mounts it. The parameter is the mock test double.
  client.observable.fetch = (query) => {
    if (query.includes(`_type=="${RELEASE_DOCUMENT_TYPE}"`)) {
      return of([activeASAPRelease])
    }
    return of([])
  }
  client.observable.request = (options) => {
    if (options.url?.includes('/doc/')) {
      return of({omitted: []})
    }
    return request(options)
  }
}

const patchedClients = new WeakSet<object>()

function ReleaseFetchPatch({children}: {children: ReactNode}) {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  if (!patchedClients.has(client)) {
    patchedClients.add(client)
    patchReleaseClient(client as ReleaseQueryClient)
  }
  return children
}

function ReleaseDetailHarness() {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <DetailProviders>
        <ReleaseFetchPatch>
          <RouterProvider
            onNavigate={() => undefined}
            router={detailRouter}
            state={{releaseId: 'rASAP'}}
          >
            <div style={{display: 'flex', flexDirection: 'column', height: 640}}>
              <ReleaseDetail />
            </div>
          </RouterProvider>
        </ReleaseFetchPatch>
      </DetailProviders>
    </TestWrapper>
  )
}

describe('release detail chrome', () => {
  test('renders archived and published banners', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <VStack gap={4}>
          <ArchivedReleaseBanner release={archivedScheduledRelease} />
          <ArchivedReleaseBanner release={publishedASAPRelease} />
        </VStack>
      </ChromeHarness>,
    )

    await expect.element(page.getByText('This release is archived')).toBeVisible()
    await expect.element(page.getByText('This release is published successfully.')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the validating progress copy', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <ValidationProgressIndicator documents={validatingDocuments} />
      </ChromeHarness>,
    )

    // Leave validation unfinished so the finished-state timer never starts.
    await expect.element(page.getByText('Validating documents: 1 of 2')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders closed release type labels', async () => {
    const {settleChromaticEndState} = testHelpers()
    if (!isNotArchivedRelease(activeASAPRelease) || !isNotArchivedRelease(activeUndecidedRelease)) {
      throw new Error('asap and undecided fixtures are open releases')
    }

    void render(
      <ChromeHarness>
        <VStack gap={3}>
          <ReleaseTypePicker release={activeASAPRelease} />
          <ReleaseTypePicker release={activeUndecidedRelease} />
        </VStack>
      </ChromeHarness>,
    )

    await expect.element(page.getByText('As soon as possible')).toBeVisible()
    await expect.element(page.getByText('Undecided')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the dashboard header title', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <HeaderHarness />
      </ChromeHarness>,
    )

    await expect.element(page.getByText('Releases')).toBeVisible()
    await expect.element(page.getByText('active asap Release')).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Activity'})).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders publish failure details while documents validate', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <ReleaseDashboardDetails
          documents={validatingDocuments}
          events={[]}
          release={activeASAPErrorRelease}
        />
      </ChromeHarness>,
    )

    await expect.element(page.getByText('Failed to publish').first()).toBeVisible()
    await expect.element(page.getByText('Validating documents: 1 of 2')).toBeVisible()
    await expect
      .poll(
        () =>
          page
            .getByTestId('release-permission-error-details')
            .elements()
            .filter((element) => element.checkVisibility()).length,
      )
      .toBe(0)
    await settleChromaticEndState()
  })

  test('renders a publish activity row', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <ReleaseActivityListItem
          event={publishEvent}
          releaseId={activeASAPRelease._id}
          releaseTitle="Spring launch"
        />
      </ChromeHarness>,
    )

    await expect.element(page.getByText(/Published the/)).toBeVisible()
    await expect.element(page.getByText('Spring launch')).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the activity panel error and a loaded event', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <VStack gap={4}>
          <div style={{display: 'flex', height: 180, justifyContent: 'flex-end'}}>
            <ReleaseDashboardActivityPanel events={failedEvents} release={activeASAPRelease} show />
          </div>
          <div style={{display: 'flex', height: 220, justifyContent: 'flex-end'}}>
            <ReleaseDashboardActivityPanel events={loadedEvents} release={activeASAPRelease} show />
          </div>
        </VStack>
      </ChromeHarness>,
    )

    await expect
      .element(page.getByText('An error occurred getting the release activity'))
      .toBeVisible()
    await expect.element(page.getByText('Activity').first()).toBeVisible()
    await expect.element(page.getByText(/Published the/)).toBeVisible()
    await settleChromaticEndState()
  })

  test('renders the cardinality-one empty summary', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <ChromeHarness>
        <div style={{height: 280}}>
          <ReleaseSummary documents={[]} release={activeCardinalityOneRelease} />
        </div>
      </ChromeHarness>,
    )

    await expect.element(page.getByText('No document in this release')).toBeVisible()
    await expect
      .element(
        page.getByText(
          'This scheduled draft does not contain a document. It may have been removed.',
        ),
      )
      .toBeVisible()
    await settleChromaticEndState()
  })

  test('renders a seeded release detail', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseDetailHarness />)

    await expect.element(page.getByText('active asap Release').first()).toBeVisible()
    await expect.element(page.getByText('No documents')).toBeVisible()
    await settleChromaticEndState()
  })
})
