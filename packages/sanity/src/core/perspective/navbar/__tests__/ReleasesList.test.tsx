import {type ReleaseDocument} from '@sanity/client'
import {Menu} from '@sanity/ui/menu'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ComponentProps, useState} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../../releases/store/__tests__/__mocks/useActiveReleases.mock'
import {MENU_PINNED_BLOCK_HEIGHT_VAR} from '../../styles'
import {ReleasesList} from '../ReleasesList'

/**
 * `ReleasesList` takes its filter query from `GlobalPerspectiveMenu`, which owns
 * it so it can be cleared when the popover closes. This stands in for that.
 */
function TestReleasesList(
  props: Omit<ComponentProps<typeof ReleasesList>, 'filterQuery' | 'onFilterQueryChange'> & {
    /**
     * Seeds the query instead of typing it. `userEvent.type` enters one character at a time, so an
     * assertion can land mid-word and see the list filtered by a prefix — which made the
     * label-match and empty-state cases fail intermittently under a full-suite run.
     */
    initialFilterQuery?: string
  },
) {
  const {initialFilterQuery = '', ...listProps} = props
  const [filterQuery, setFilterQuery] = useState(initialFilterQuery)
  return (
    <ReleasesList {...listProps} filterQuery={filterQuery} onFilterQueryChange={setFilterQuery} />
  )
}

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../ViewContentReleasesMenuItem', () => ({
  ViewContentReleasesMenuItem: () => null,
}))

vi.mock('../ScheduledDraftsMenuItem', () => ({
  ScheduledDraftsMenuItem: () => null,
}))

/**
 * Enough releases to clear `RELEASE_FILTER_THRESHOLD`, since the menu offers no filter below it.
 * The three fixtures are cloned with distinct ids and titles so filter assertions stay meaningful.
 */
function enoughReleasesToFilter(): ReleaseDocument[] {
  const base = [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease]

  return Array.from({length: 12}, (_unused, index) => {
    const template = base[index % base.length]
    return {
      ...template,
      _id: `${template._id}-bulk${index}`,
      metadata: {...template.metadata, title: `${template.metadata.title} ${index}`},
    }
  })
}

describe('ReleasesList', () => {
  describe('when releases are enabled', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
    })

    it('renders releases when not loading', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()
    })

    it('narrows the list by the filter query, published and drafts included', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [
          activeASAPRelease,
          activeScheduledRelease,
          activeUndecidedRelease,
          ...enoughReleasesToFilter(),
        ],
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      await userEvent.type(screen.getByTestId('release-menu-filter'), 'undecided')

      await waitFor(() => {
        expect(screen.queryByText('active asap Release')).not.toBeInTheDocument()
      })
      expect(screen.queryByText('active Release')).not.toBeInTheDocument()
      // The matched run is wrapped so it can be marked, which splits the title across elements —
      // `getByText` with the whole title no longer matches. Read the row's text instead.
      expect(screen.getByTestId('release-rUndecided')).toHaveTextContent('undecided Release')

      // Published and Drafts are matched on their own labels. Leaving them in place would put two
      // entries above a result list that neither of them belongs to.
      expect(screen.queryByTestId('release-published')).not.toBeInTheDocument()
      expect(screen.queryByTestId('release-drafts')).not.toBeInTheDocument()
    })

    it('marks where the term appears inside a matching title', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        // The original fixture keeps its own id so the row can be addressed; the clones are only
        // there to clear the filter threshold.
        data: [activeUndecidedRelease, ...enoughReleasesToFilter()],
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled initialFilterQuery="undecid" />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      const row = screen.getByTestId('release-rUndecided')

      // The marked run is its own element containing exactly what was typed, so it is addressable
      // by that text; the row as a whole still reads as the release was named.
      expect(within(row).getByText('undecid').tagName).toBe('STRONG')
      expect(row).toHaveTextContent('undecided Release')
    })

    it('marks the term inside the published label, not only inside release titles', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: enoughReleasesToFilter(),
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled initialFilterQuery="pub" />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      // Published and drafts render outside `ReleaseTypeMenuSection`, so they take the term by a
      // different route and need their own coverage.
      const published = screen.getByTestId('release-published')
      expect(within(published).getByText('Pub').tagName).toBe('STRONG')
      expect(published).toHaveTextContent('Published')
    })

    it('keeps published when the term matches its label', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: enoughReleasesToFilter(),
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled initialFilterQuery="publi" />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-published')).toBeInTheDocument()
      expect(screen.queryByTestId('release-drafts')).not.toBeInTheDocument()
    })

    it('hides the actions while filtering, and shows a message when nothing matches', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: enoughReleasesToFilter(),
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled initialFilterQuery="zzzznothing" />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-menu-no-results')).toBeInTheDocument()
      // The actions are navigation, not results, so they step aside for the duration of the filter.
      expect(screen.queryByTestId('release-menu-actions')).not.toBeInTheDocument()
    })

    it('offers no filter while the whole list is on screen', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      // Three releases, all visible. A filter here is a control with nothing to do.
      expect(screen.queryByTestId('release-menu-filter')).not.toBeInTheDocument()
    })

    it('offers a filter once the list is long enough to need one', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: enoughReleasesToFilter(),
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-menu-filter')).toBeInTheDocument()
    })

    it('publishes the pinned filter block height for the section headings to pin below', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: enoughReleasesToFilter(),
      })
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      // The headings resolve their sticky offset from this property. jsdom has no layout, so the
      // value is 0px; what is under test is that it is published at all - unset means the effect
      // bailed, and the headings then pin at 0px, underneath the filter block itself.
      const root = screen.getByTestId('release-menu-filter').closest('[data-ui="Menu"]')

      expect(root?.getAttribute('style')).toContain(`${MENU_PINNED_BLOCK_HEIGHT_VAR}: 0px`)
    })

    it('renders the action card, which carries the divider above the actions', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByTestId('release-menu-actions')).toBeInTheDocument()
    })
  })

  describe('when releases with cardinality filtering are enabled', () => {
    beforeEach(async () => {
      const releaseWithCardinalityOne: ReleaseDocument = {
        ...activeASAPRelease,
        _id: '_.releases.rCardinalityOne',
        metadata: {
          ...activeASAPRelease.metadata,
          title: 'Cardinality One Release',
          cardinality: 'one',
        },
      }

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [
          activeASAPRelease,
          activeScheduledRelease,
          activeUndecidedRelease,
          releaseWithCardinalityOne,
        ],
      })
    })

    it('filters out releases with cardinality "one"', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      expect(screen.getByText('active asap Release')).toBeInTheDocument()
      expect(screen.getByText('active Release')).toBeInTheDocument()
      expect(screen.getByText('undecided Release')).toBeInTheDocument()

      expect(screen.queryByText('Cardinality One Release')).not.toBeInTheDocument()
    })
  })

  describe('when releases are disabled', () => {
    beforeEach(async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
      })
    })

    it('should hide the releases list, but show publish and draft', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled={false} />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      await waitFor(() => {
        expect(screen.getByTestId('release-drafts')).toBeInTheDocument()
        expect(screen.queryByTestId('release-rASAP')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rScheduled')).not.toBeInTheDocument()
        expect(screen.queryByTestId('release-rActive')).not.toBeInTheDocument()
      })
      expect(screen.getByTestId('release-drafts')).toBeInTheDocument()
    })

    it('should not render the action card at all, so its border is not left behind', async () => {
      const wrapper = await createTestProvider()
      render(
        <Menu>
          <TestReleasesList areReleasesEnabled={false} />
        </Menu>,
        {wrapper},
      )
      await flushMicrotasksThisIsACodeSmell()

      // The card carries `borderTop`, so hiding every item inside it is not enough: an empty card
      // still draws a divider with nothing under it.
      expect(screen.queryByTestId('release-menu-actions')).not.toBeInTheDocument()
    })
  })
})
