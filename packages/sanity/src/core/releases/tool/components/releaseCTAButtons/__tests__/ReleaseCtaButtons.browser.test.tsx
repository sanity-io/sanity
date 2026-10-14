import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Flex} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {createMockDocument} from '../../../../__fixtures__/documentInRelease.fixture'
import {activeASAPRelease, scheduledRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ReleasePublishAllButton} from '../ReleasePublishAllButton'
import {ReleaseRevertButton} from '../ReleaseRevertButton/ReleaseRevertButton'
import {ReleaseScheduleButton} from '../ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../ReleaseUnscheduleButton'

const releaseDocument = createMockDocument()

function CtaHarness({children}: {children: ReactNode}) {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4}>{children}</Card>
    </TestWrapper>
  )
}

describe('release call-to-action buttons', () => {
  test('opens the unschedule confirmation', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <CtaHarness>
        <ReleaseUnscheduleButton documents={[releaseDocument]} release={scheduledRelease} />
      </CtaHarness>,
    )

    await expect.element(page.getByRole('button', {name: 'Unschedule release'})).toBeVisible()
    await userEvent.click(page.getByTestId('schedule-button'))
    await expect
      .element(page.getByText('Are you sure you want to unschedule the release?'))
      .toBeVisible()
    await expect
      .element(page.getByText('The release will no longer be published on the scheduled date'))
      .toBeVisible()
    await settleChromaticEndState()
  })

  test('opens the publish confirmation', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <CtaHarness>
        <ReleasePublishAllButton documents={[releaseDocument]} release={activeASAPRelease} />
      </CtaHarness>,
    )

    const publishButton = page.getByTestId('publish-all-button')
    await expect.element(publishButton).toBeEnabled()
    await userEvent.click(publishButton)
    await expect
      .element(
        page.getByText('Are you sure you want to publish the release and all document versions?'),
      )
      .toBeVisible()
    await settleChromaticEndState()
  })

  test('renders schedule and revert without opening their dialogs', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <CtaHarness>
        <Flex gap={3}>
          <ReleaseScheduleButton documents={[releaseDocument]} release={activeASAPRelease} />
          <ReleaseRevertButton documents={[releaseDocument]} release={activeASAPRelease} />
        </Flex>
      </CtaHarness>,
    )

    // The schedule dialog embeds a calendar (today highlight) and revert
    // resolves document history. The closed labels are the stable paint.
    await expect.element(page.getByRole('button', {name: 'Schedule release...'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Revert release'})).toBeVisible()
    await settleChromaticEndState()
  })
})
