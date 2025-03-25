/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/test'

import {createUniqueDocument, withDefaultClient} from '../../helpers'

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

      await page.goto(`/test/content/playlist;${id}`)

      const getDocumentPanelScroller = () => page.getByTestId('document-panel-scroller')
      const getStringInput = () => page.getByTestId('string-input')
      const getLiveEditTypeBanner = () => page.getByTestId('live-edit-type-banner')

      await expect(getDocumentPanelScroller()).toBeAttached()
      await expect(getStringInput()).toBeAttached()

      // checks that inputs are set to read only
      await expect(getStringInput()).toHaveAttribute('readonly', '')
      // checks that the banner is visible
      await expect(getLiveEditTypeBanner()).toBeVisible()
    })
  })
})
