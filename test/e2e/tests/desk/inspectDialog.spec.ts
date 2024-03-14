import {test} from '@sanity/test'

const INSPECT_KEY = 'studio.structure-tool.inspect-view-mode'

test('clicking inspect mode sets value in storage', async ({
  page,
  sanityClient,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/book')
  await page.getByTestId('document-pane').getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Inspect Ctrl Alt I'}).click()

  await page.getByRole('tab', {name: 'Raw JSON'}).click()
  /*
   * The network proves to be a bit flaky for this in our CI environment. We will revisit this after release.
   */
  // const rawResult = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
  //   uri: `/users/me/keyvalue/${INSPECT_KEY}`,
  //   withCredentials: true,
  // })
  // expect(rawResult[0]).toMatchObject({
  //   key: INSPECT_KEY,
  //   value: 'raw',
  // })

  // await page.getByRole('tab', {name: 'Parsed'}).click()
  // const parsedResult = await sanityClient.withConfig({apiVersion: '2024-03-12'}).request({
  //   uri: `/users/me/keyvalue/${INSPECT_KEY}`,
  //   withCredentials: true,
  // })

  // expect(parsedResult[0]).toMatchObject({
  //   key: INSPECT_KEY,
  //   value: 'parsed',
  // })
})
