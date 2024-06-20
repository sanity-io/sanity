import {expect} from '@playwright/test'
import {test} from '@sanity/test'

interface ActionsFeatureToggle {
  actions: boolean
}

/* 
  Test skipped due to on going developments around server actions that make them flaky 
  Re-enable this test when the server actions are stable 
  */
test.skip(`document actions follow appropriate logic after receiving response from feature toggle endpoint`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/book')

  const featureToggleRequest = page.waitForResponse(async (response) => {
    return response.url().includes('/data/actions') && response.request().method() === 'GET'
  })

  const featureToggleResponse: ActionsFeatureToggle = await (await featureToggleRequest).json()

  await page.getByTestId('field-title').getByTestId('string-input').fill('Test title')

  if (featureToggleResponse.actions) {
    const actionsEditRequest = page.waitForResponse(async (response) => {
      return response.url().includes('/data/actions') && response.request().method() === 'POST'
    })

    const actionsEditResponse = await (await actionsEditRequest).json()

    expect(actionsEditResponse).toEqual(
      expect.objectContaining({
        transactionId: expect.any(String),
      }),
    )
  } else {
    const mutateEditRequest = page.waitForResponse(async (response) => {
      return response.url().includes('/data/mutate') && response.request().method() === 'POST'
    })

    const mutateEditResponse = await (await mutateEditRequest).json()

    expect(mutateEditResponse).toEqual(
      expect.objectContaining({
        transactionId: expect.any(String),
        results: [
          {
            id: expect.any(String),
            operation: expect.any(String),
          },
        ],
      }),
    )
  }
})
