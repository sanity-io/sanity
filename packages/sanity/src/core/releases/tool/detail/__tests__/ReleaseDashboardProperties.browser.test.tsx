import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDashboardDetails} from '../ReleaseDashboardDetails'

const SCROLLER_HEIGHT = 400
const DETAIL_HEIGHT = 1200

function TallDetail() {
  return <div data-testid="tall-detail" style={{height: DETAIL_HEIGHT}} />
}

function ScrollingDetailHarness({children}: {children: ReactNode}) {
  return (
    <TestWrapper
      betaFeatures={{variants: {enabled: true}}}
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      plugins={[{name: 'tall-detail', releases: {detail: TallDetail}}]}
      schemaTypes={[]}
    >
      <LocaleProvider>
        <Card data-testid="detail-scroller" overflow="auto" style={{height: SCROLLER_HEIGHT}}>
          {children}
          <div data-testid="document-table" style={{height: DETAIL_HEIGHT}} />
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}

function offsetFromScrollerTop(testId: string): {top: number; bottom: number} {
  const scroller = page.getByTestId('detail-scroller').element().getBoundingClientRect()
  const element = page.getByTestId(testId).element().getBoundingClientRect()
  return {top: element.top - scroller.top, bottom: element.bottom - scroller.top}
}

function scrollTo(top: number) {
  page.getByTestId('detail-scroller').element().scrollTop = top
}

describe('release properties', () => {
  test('stay in view beside a tall detail and scroll away with the top row', async () => {
    void render(
      <ScrollingDetailHarness>
        <ReleaseDashboardDetails documents={[]} events={[]} release={activeASAPRelease} />
      </ScrollingDetailHarness>,
    )

    await expect.element(page.getByTestId('tall-detail')).toBeInTheDocument()
    await expect.element(page.getByTestId('release-detail-metadata')).toBeVisible()

    scrollTo(DETAIL_HEIGHT / 2)
    await expect
      .poll(() => offsetFromScrollerTop('release-detail-metadata').top)
      .toBeGreaterThanOrEqual(0)
    expect(offsetFromScrollerTop('release-detail-metadata').top).toBeLessThan(40)

    scrollTo(DETAIL_HEIGHT + SCROLLER_HEIGHT / 2)
    await expect.poll(() => offsetFromScrollerTop('release-detail-metadata').bottom).toBeLessThan(0)
    expect(offsetFromScrollerTop('document-table').top).toBeLessThan(SCROLLER_HEIGHT)
  })
})
