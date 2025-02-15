import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {mockActionsFeatureToggle} from '../../helpers/mockActionsFeatureToggle'

// This test is skipped because the feature toggle is disable by the use of `releases`, see https://github.com/sanity-io/sanity/blob/corel/packages/sanity/src/core/releases/plugin/index.ts#L61-L62
// Re enable once the feature toggle is removed and we support serverDocumentActions with releases.
test.skip('Actions API should be used if the feature toggle is enabled and the Studio version satisfies the `compatibleStudioVersions` constraint', async ({
  page,
  createDraftDocument,
}) => {
  await mockActionsFeatureToggle({
    response: {
      enabled: true,
      compatibleStudioVersions: '>= 3',
    },
    page,
  })

  const actionsEditRequest = page.waitForResponse(
    (response) =>
      response.url().includes('/data/actions') && response.request().method() === 'POST',
    {
      timeout: 20_000,
    },
  )

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await titleInput.fill('Test title')
  const actionsEditResponse = await (await actionsEditRequest).json()

  expect(actionsEditResponse).toEqual(
    expect.objectContaining({
      transactionId: expect.any(String),
    }),
  )
})

test('Actions API should not be used if the feature toggle is enabled, but the Studio version does not satisfy the `compatibleStudioVersions` constraint', async ({
  page,
  createDraftDocument,
}) => {
  await mockActionsFeatureToggle({
    response: {
      enabled: true,
      compatibleStudioVersions: '< 3.0.0',
    },
    page,
  })

  const mutateEditRequest = page.waitForResponse(
    (response) => response.url().includes('/data/mutate') && response.request().method() === 'POST',
    {
      timeout: 20_000,
    },
  )

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await titleInput.fill('Test title')
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
})

test('Actions API should not be used if the feature toggle is not enabled, regardless of whether the Studio version satisfies the `compatibleStudioVersions` constraint', async ({
  page,
  createDraftDocument,
}) => {
  await mockActionsFeatureToggle({
    response: {
      enabled: false,
      compatibleStudioVersions: '>= 3',
    },
    page,
  })

  const mutateEditRequest = page.waitForResponse(
    (response) => response.url().includes('/data/mutate') && response.request().method() === 'POST',
    {
      timeout: 20_000,
    },
  )

  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await titleInput.fill('Test title')
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
})
