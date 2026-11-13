import {configure} from '@chromatic-com/vitest'
import {type ReleaseDocument} from '@sanity/client'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {
  activeCardinalityOneRelease,
  archivedScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {EMPTY_ARRAY} from '../../util/empty'
import {PerspectiveProvider} from '../PerspectiveProvider'
import {ResetArchivedReleasePerspective} from '../ResetArchivedReleasePerspective'

const publishedScheduledDraft: ReleaseDocument = {
  ...activeCardinalityOneRelease,
  state: 'published',
  publishedAt: '2023-10-10T10:00:00Z',
}

const {archivedReleases} = vi.hoisted(() => ({
  archivedReleases: {current: [] as ReleaseDocument[]},
}))

// The mock client never returns archived releases, so the store hands out the fixture the test
// selects as the sticky perspective.
vi.mock('../../releases/store/useArchivedReleases', () => ({
  useArchivedReleases: () => ({data: archivedReleases.current, loading: false, error: undefined}),
}))

// The toast's 10 second countdown bar is a JS-driven Motion `scaleX` animation, so its width at
// capture time depends on how long the test took to get there.
configure({ignoreSelectors: ['[data-ui="ToastLoadingBar"]']})

/**
 * Chromatic sentinel for the warning toast shown when the sticky release perspective is reset
 * because that release was archived or published: the muted size-1 title and description.
 */
function ResetArchivedReleasePerspectiveHarness({release}: {release: ReleaseDocument}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <PerspectiveProvider
        selectedPerspectiveName={release.name}
        excludedPerspectives={EMPTY_ARRAY}
      >
        <ResetArchivedReleasePerspective />
      </PerspectiveProvider>
    </TestWrapper>
  )
}

describe('ResetArchivedReleasePerspective', () => {
  beforeEach(() => {
    archivedReleases.current = []
  })

  it('warns that the selected release was archived', async () => {
    const {settleChromaticEndState} = testHelpers()
    archivedReleases.current = [archivedScheduledRelease]
    void render(<ResetArchivedReleasePerspectiveHarness release={archivedScheduledRelease} />)

    await expect
      .element(page.getByText("The 'archived Release' release was archived"))
      .toBeVisible()
    await expect.element(page.getByText('This release has been unpinned')).toBeVisible()

    await settleChromaticEndState()
  })

  it('tells that the selected scheduled draft was published', async () => {
    const {settleChromaticEndState} = testHelpers()
    archivedReleases.current = [publishedScheduledDraft]
    void render(<ResetArchivedReleasePerspectiveHarness release={publishedScheduledDraft} />)

    await expect.element(page.getByText('The scheduled draft was published')).toBeVisible()

    await settleChromaticEndState()
  })
})
