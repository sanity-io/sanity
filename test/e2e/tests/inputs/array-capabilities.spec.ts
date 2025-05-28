import {expect} from '@playwright/test'
import {type SanityDocument} from '@sanity/client'

import {test as base} from '../../studio-test'

const test = base.extend<{testDoc: SanityDocument}>({
  testDoc: async ({page, sanityClient}, use) => {
    const referenceDoc = await sanityClient.create({
      _type: 'author',
      name: 'Test Author',
    })
    const testDoc = await sanityClient.create({
      _type: 'arrayCapabilities',
      title: 'e2e fixture',
      objectArray: [
        {_type: 'something', _key: '5b75c4005e47', first: 'First'},
        {_type: 'something', _key: 'd2aa1b6c4ca7', first: 'Second'},
      ],
      objectArrayAsGrid: [
        {_type: 'something', _key: '6ec7989ea20a', first: 'First'},
        {_type: 'something', _key: '630ae68957fb', first: 'Second'},
      ],
      primitiveArray: ['First', 2],
      arrayOfReferences: [{_type: 'reference', _ref: referenceDoc._id}],
    })
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(testDoc)
    await sanityClient.delete(testDoc._id)
    await sanityClient.delete(referenceDoc._id)
  },
})

test(`Scenario: Disabling all array capabilities`, async ({page, testDoc}) => {
  await page.goto(`/content/input-debug;arrayCapabilities;${testDoc._id}`)
  await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
    timeout: 40000,
  })

  const [objectArrayField, gridObjectArrayField, primitiveArrayField] = [
    page.getByTestId('field-objectArray'),
    page.getByTestId('field-objectArrayAsGrid'),
    page.getByTestId('field-primitiveArray'),
  ] as const

  for (const field of [objectArrayField, gridObjectArrayField]) {
    await expect(field).toBeAttached()
    await expect(field.getByTestId('array-item-menu-button')).not.toBeAttached()
    await expect(field.getByTestId('add-single-object-button')).not.toBeAttached()
    await expect(field.getByTestId('add-multiple-object-button')).not.toBeAttached()
  }
  await expect(primitiveArrayField).toBeAttached()
  await expect(primitiveArrayField.getByTestId('add-single-primitive-button')).not.toBeAttached()
  await expect(primitiveArrayField.getByTestId('add-multiple-primitive-button')).not.toBeAttached()
})
