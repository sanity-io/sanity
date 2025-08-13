import {expect} from '@playwright/test'

import {createUniqueDocument} from '../../helpers'
import {withDefaultClient} from '../../helpers/sanityClient'
import {test} from '../../studio-test'

withDefaultClient((context) => {
  test.describe('sanity/structure: document pane', () => {
    test('on live edit document with a draft, a banner should appear', async ({page}) => {
      // create published document
      const uniqueDoc = await createUniqueDocument(context.client, {_type: 'playlist'})
      const id = uniqueDoc._id!

      // create draft document
      await createUniqueDocument(context.client, {
        _type: 'playlist',
        _id: `drafts.${id}`,
        name: 'Edited by e2e test runner',
      })

      await page.goto(`/content/playlist;${id}`)

      await expect(page.getByTestId('document-panel-scroller')).toBeAttached()
      await expect(page.getByTestId('string-input')).toBeAttached()

      // checks that inputs are set to read only
      await expect(await page.getByTestId('string-input')).toHaveAttribute('readonly', '')
      // checks that the banner is visible
      await expect(page.getByTestId('live-edit-type-banner')).toBeVisible()
    })
  })
})
