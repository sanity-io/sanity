import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('Draft pinned version', () => {
  test('draft, no publish, no version - shows draft displayed', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto('/test/content/species;bd339577-7a28-4254-a74c-7989bf618a43')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    await expect(page.getByTestId('document-header-Draft-chip')).toHaveAttribute('data-selected')

    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) draft',
    )
  })

  test('draft, publish, no version - shows draft from published displayed', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto('/test/content/species;a88ce001-506d-45b2-b95d-ab2a674e7fc0')

    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) published',
    )
  })

  test(`no draft, no publish, single version - shows version displayed`, async ({page}) => {
    // specific document set up for this test in mind
    await page.goto('/test/content/species;d590cd97-1c40-4269-b4e3-948dc479dcff')

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chilp
    await expect(page.getByTestId('document-header-Draft-chip')).toBeDisabled()

    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) ASAP A',
    )
  })

  test('no draft, no publish, multiple version - shows first version displayed', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto('/test/content/species;49e39ee0-3320-4e23-b995-b66a2e1d0a12')

    // Wait for document to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(
      page.getByTestId('document-header-(DO-NOT-PUBLISH)-Undecided-A-chip'),
    ).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).toBeDisabled()
    await expect(
      page.getByTestId('document-header-(DO-NOT-PUBLISH)-Undecided-A-chip'),
    ).not.toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) ASAP A',
    )
  })
})

test.describe('Published pinned version', () => {
  test('draft, publish, no version - shows draft displayed', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;a88ce001-506d-45b2-b95d-ab2a674e7fc0?perspective=published',
    )

    // Wait for document to load
    await expect(page.getByTestId('document-header-Published-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Published-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) published',
    )
  })

  test(`no draft, publish, single version - shows published displayed`, async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;a88ce001-506d-45b2-b95d-ab2a674e7fc0?perspective=rn1Ve3iTh',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Published-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Published-chip')).not.toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) published',
    )
  })
})

test.describe('Realeases pinned versions', () => {
  test('draft, no publish, no version - shows draft', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;bd339577-7a28-4254-a74c-7989bf618a43?perspective=ra6ZDFboX',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) draft',
    )
  })

  test('no draft, no publish, single same version as pinned - shows version', async ({page}) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;d590cd97-1c40-4269-b4e3-948dc479dcff?perspective=rn1Ve3iTh',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) ASAP A',
    )
  })

  test('no draft, no publish, single different version as pinned - shows single existing document', async ({
    page,
  }) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;d590cd97-1c40-4269-b4e3-948dc479dcff?perspective=r56VOgCmW',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(
      page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip'),
    ).not.toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) ASAP A',
    )
  })

  test('no draft, no publish, multiple different versions, one of them is pinned - shows pinned version', async ({
    page,
  }) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;49e39ee0-3320-4e23-b995-b66a2e1d0a12?perspective=r56VOgCmW',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(
      page.getByTestId('document-header-(DO-NOT-PUBLISH)-Undecided-A-chip'),
    ).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(
      page.getByTestId('document-header-(DO-NOT-PUBLISH)-Undecided-A-chip'),
    ).toHaveAttribute('data-selected')

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) Undecided A',
    )
  })

  test('no draft, no publish, multiple different versions, different version pinned - shows first version', async ({
    page,
  }) => {
    // specific document set up for this test in mind
    await page.goto(
      '/test/content/species;49e39ee0-3320-4e23-b995-b66a2e1d0a12?perspective=ra6ZDFboX',
    )

    // wait to load
    await expect(page.getByTestId('document-header-Draft-chip')).toBeVisible()
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toBeVisible()
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()

    // chip
    await expect(page.getByTestId('document-header-Draft-chip')).not.toHaveAttribute(
      'data-selected',
    )
    await expect(page.getByTestId('document-header-(DO-NOT-PUBLISH)-ASAP-A-chip')).toHaveAttribute(
      'data-selected',
    )

    // field
    await expect(page.getByTestId('field-name').getByTestId('string-input')).toHaveValue(
      '(DO NOT CHANGE) ASAP A',
    )
  })
})
