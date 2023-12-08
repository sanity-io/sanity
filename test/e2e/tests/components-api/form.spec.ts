import {test, expect} from '@playwright/test'

// We just need an id in the URL to render the form
const id = 'test-id'

test.describe('Form Components API:', () => {
  test('form.components.input', async ({page}) => {
    page.goto(`/test/content/v3;formComponentsApi;${id}`)

    await expect(
      page
        .getByTestId('child-parent-config-form-input')
        .getByTestId('parent-config-form-input')
        .getByTestId('string-input'),
    ).toBeVisible()
  })

  test('form.components.field', async ({page}) => {
    page.goto(`/test/content/v3;formComponentsApi;${id}`)

    await expect(
      page
        .getByTestId('child-parent-config-form-field')
        .getByTestId('parent-config-form-field')
        .getByTestId('field-string'),
    ).toBeVisible()
  })
})
