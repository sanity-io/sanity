import {configure} from '@chromatic-com/vitest'
import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {activeCardinalityOneRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ScheduledDraftDocumentPreview} from '../ScheduledDraftDocumentPreview'
import {ScheduledDraftWarningCell} from '../ScheduledDraftWarningCell'

const cellProps = {id: 'scheduled-draft-cell', style: {}}

function CellsHarness({children}: {children: ReactNode}) {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4} style={{width: 360}}>
        {children}
      </Card>
    </TestWrapper>
  )
}

describe('scheduled draft cells', () => {
  test('renders the past-date warning icon', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(
      <CellsHarness>
        <ScheduledDraftWarningCell
          cellProps={cellProps}
          datum={activeCardinalityOneRelease}
          sorting={false}
        />
      </CellsHarness>,
    )

    await expect.element(page.getByTestId('warning-indicator')).toBeVisible()
    await settleChromaticEndState()
  })

  test('document preview has no loaded document to paint', async () => {
    // The preview stays on an animated skeleton until a document loads from the
    // network. Importing the cell covers the file; the skeleton is not archived.
    configure({disableAutoSnapshot: true})
    void render(
      <CellsHarness>
        <ScheduledDraftDocumentPreview
          cellProps={cellProps}
          datum={activeCardinalityOneRelease}
          sorting={false}
        />
      </CellsHarness>,
    )

    await expect
      .poll(() => document.querySelectorAll('[data-ui="Skeleton"]').length)
      .toBeGreaterThan(0)
  })
})
