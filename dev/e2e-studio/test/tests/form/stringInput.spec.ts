import {test, expect} from '../../fixtures/documentActionFixtures'
import {generateTestReport} from '../../helpers'

test.describe('@sanity/default-layout: Navbar', () => {
  test('example test', async ({page, createDocument, deleteDocument}, testInfo) => {
    const {_id} = await createDocument({
      _type: 'stringTest',
      title: testInfo.title,
      testInfo: generateTestReport(testInfo),
    })
    await page.goto(`desk/stringTest;${_id}`)
    const field = page.getByTestId('field-title')
    await expect(field).toBeVisible()
    await expect(field.getByTestId('string-input')).toBeNull()
    if (testInfo.status === 'passed' && _id) {
      await deleteDocument(_id)
    }
  })
})
