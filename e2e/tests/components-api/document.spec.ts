import {expect} from '@playwright/test'

import {test} from '../../studio-test'

// We just need an id in the URL to render the form
const id = 'test-id'

test.describe('Document Components API:', () => {
  test('document.components.layout', async ({page}) => {
    page.goto(`/content/v3;formComponentsApi;${id}`)

    await expect(
      page
        .getByTestId('child-parent-config-document-layout')
        .getByTestId('parent-config-document-layout')
        .getByTestId('document-pane'),
    ).toBeVisible()
  })
})
