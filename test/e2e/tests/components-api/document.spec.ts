import {test, expect} from '@playwright/test'

// We just need an id in the URL to render the form
const id = 'test-id'

test.describe('Document Components API:', () => {
  test('document.components.layout', async ({page}) => {
    page.goto(`/test/content/v3;formComponentsApi;${id}`)

    await expect(
      page.getByTestId('config-document-layout').getByTestId('document-pane'),
    ).toBeVisible()
  })
})
