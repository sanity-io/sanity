import {Card} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {activeASAPRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {DuplicateReleaseToastLink} from '../DuplicateReleaseToastLink'
import {ReleaseMenuButton} from '../ReleaseMenuButton'

function MenuHarness() {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4}>
        <VStack gap={4}>
          <DuplicateReleaseToastLink actionResult={{releaseId: activeASAPRelease._id}} />
          <ReleaseMenuButton documentsCount={1} release={activeASAPRelease} />
        </VStack>
      </Card>
    </TestWrapper>
  )
}

describe('release menu surfaces', () => {
  test('renders the duplicate toast link and opens the archive dialog', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<MenuHarness />)

    await expect.element(page.getByText('View duplicated release')).toBeVisible()

    const menuButton = page.getByTestId('release-menu-button')
    await expect.element(menuButton).toBeEnabled()
    await userEvent.click(menuButton)

    const archiveItem = page.getByRole('menuitem', {name: 'Archive release'})
    await expect.element(archiveItem).toBeEnabled()
    await userEvent.click(archiveItem)

    await expect
      .element(page.getByText('Are you sure you want to archive this release?'))
      .toBeVisible()
    await settleChromaticEndState()
  })
})
