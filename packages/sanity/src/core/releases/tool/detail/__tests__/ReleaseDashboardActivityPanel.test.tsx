import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, test} from 'vitest'

import {
  namedInTransitions,
  stubViewTransitions,
} from '../../../../../../test/testUtils/stubViewTransitions'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {STUDIO_RESIZE_TRANSITION_TYPE} from '../../../../viewTransitions/transitionTypes'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type ReleaseEvents} from '../events/useReleaseEvents'
import {
  ActivityPanelPushedContent,
  ReleaseDashboardActivityPanel,
} from '../ReleaseDashboardActivityPanel'

const events: ReleaseEvents = {
  events: [],
  loading: false,
  error: null,
  hasMore: false,
  loadMore: () => {},
}

function Detail(props: {overlay?: boolean; show: boolean}) {
  return (
    <div style={{display: 'flex', position: 'relative'}}>
      <ActivityPanelPushedContent>
        <div data-testid="content" />
      </ActivityPanelPushedContent>
      <ReleaseDashboardActivityPanel
        events={events}
        overlay={props.overlay}
        release={activeASAPRelease}
        show={props.show}
      />
    </div>
  )
}

async function renderWithProviders(children: ReactNode) {
  const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})
  return render(children, {wrapper})
}

describe('ReleaseDashboardActivityPanel', () => {
  test('opens the in-flow panel in a resize transition that morphs the column it pushes aside', async () => {
    const pictured = stubViewTransitions()
    const {rerender} = await renderWithProviders(<Detail show={false} />)
    rerender(<Detail show />)

    expect(await screen.findByText('Activity')).toBeInTheDocument()
    expect(pictured.map((transition) => transition.types)).toEqual([
      ['sanity-activity-panel-toggle', STUDIO_RESIZE_TRANSITION_TYPE],
    ])
    expect(namedInTransitions(pictured)).toEqual(['content', 'div'])
  })

  test('opens the overlay drawer in a transition that leaves the column out', async () => {
    const pictured = stubViewTransitions()
    const {rerender} = await renderWithProviders(<Detail overlay show={false} />)
    rerender(<Detail overlay show />)

    expect(await screen.findByRole('dialog', {name: 'Activity'})).toBeInTheDocument()
    expect(pictured.map((transition) => transition.types)).toEqual([
      ['sanity-activity-drawer-toggle'],
    ])
    expect(namedInTransitions(pictured)).not.toContain('content')
  })
})
