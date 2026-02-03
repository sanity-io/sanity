import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('sanity/structure: document pane', () => {
  test('on document with defaultPanes, the panes should be expanded', async ({page}) => {
    // await createDraftDocument('/content/input-debug;manyViews')
    await page.goto(`/content/input-debug;manyViews;foo-id`)
    // It should render the two panes
    await expect(page.getByTestId('document-pane')).toHaveCount(2)
    // The url contains the two panes and the expected params
    expect(page.url()).toContain(
      'content/input-debug;manyViews;foo-id%2Cview%3Deditor%2Cexpanded%3Dtrue%7C%2Cview%3Djson-10',
    )
  })
})
