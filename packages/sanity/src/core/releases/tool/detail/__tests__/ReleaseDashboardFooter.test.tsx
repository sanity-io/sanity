import {render, screen, waitFor} from '@testing-library/react'
import {describe, expect, test} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDashboardFooter} from '../ReleaseDashboardFooter'

const renderTest = async (props?: Partial<React.ComponentProps<typeof ReleaseDashboardFooter>>) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  const rendered = render(
    <ReleaseDashboardFooter
      release={activeASAPRelease}
      events={[]}
      documents={[]}
      {...(props || {})}
    />,
    {
      wrapper,
    },
  )

  await waitFor(
    () => {
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    },
    {timeout: 5000, interval: 1000},
  )

  return rendered
}

describe('ReleaseDashboardFooter', () => {
  describe('for an active asap release', () => {
    test('shows publish all button', async () => {
      await renderTest()

      expect(screen.getByTestId('publish-all-button')).toBeInTheDocument()
    })
  })

  describe('for an active scheduled release', () => {
    test('shows unschedule button', async () => {
      await renderTest({release: activeScheduledRelease})

      expect(screen.getByText('Schedule for publishing...')).toBeInTheDocument()
    })
  })

  describe('for a published release', () => {
    // Revert button is now hidden in the UI until feature flag is added
    test.skip('shows revert button for asap release', async () => {
      await renderTest({release: publishedASAPRelease})

      expect(screen.getByText('Revert release')).toBeInTheDocument()
    })

    // Revert button is now hidden in the UI until feature flag is added
    test.skip('shows revert button for scheduled release', async () => {
      await renderTest({
        release: {
          ...publishedASAPRelease,
          metadata: {...publishedASAPRelease.metadata, releaseType: 'scheduled'},
        },
      })

      expect(screen.getByText('Revert release')).toBeInTheDocument()
    })
  })

  describe('for a scheduled release', () => {
    test('shows unschedule button', async () => {
      await renderTest({release: scheduledRelease})

      expect(screen.getByText('Unschedule for publishing')).toBeInTheDocument()
    })
  })

  describe('for an archived release', () => {
    test('shows the unarchive button', async () => {
      await renderTest({release: archivedScheduledRelease})

      expect(screen.getByTestId('release-dashboard-footer-actions').children.length).toEqual(1)
    })
  })
})
