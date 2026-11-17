import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {
  activeASAPRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleasePreviewCard} from '../ReleaseMenuButton/ReleasePreviewCard'
import {ReleaseTime} from '../ReleaseTime'

/**
 * Chromatic sentinel for release time copy (asap / undecided / a fixed
 * schedule) and the preview card that embeds it. Dates are fixture ISO
 * strings, so the formatted value does not depend on "today".
 */
function ReleaseTimeHarness() {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4}>
        <VStack gap={4}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              asap
            </Text>
            <ReleaseTime release={activeASAPRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              undecided
            </Text>
            <ReleaseTime release={activeUndecidedRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              scheduled
            </Text>
            <ReleaseTime release={scheduledRelease} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              archived
            </Text>
            <ReleaseTime release={archivedScheduledRelease} />
          </VStack>
          <ReleasePreviewCard release={activeASAPRelease} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}

describe('release time', () => {
  test('renders asap, undecided, and a fixed schedule', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ReleaseTimeHarness />)

    await expect.element(page.getByText('As soon as possible').first()).toBeVisible()
    // Labels sit next to the copy and match case-insensitively, so match the
    // rendered strings in full.
    await expect.element(page.getByText('Undecided', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Scheduled', {exact: true})).toBeVisible()
    await expect.element(page.getByText('active asap Release')).toBeVisible()
    await settleChromaticEndState()
  })
})
