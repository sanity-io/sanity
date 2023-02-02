import {test} from '@playwright/test'
// import {createUniqueDocument} from '../helpers'
import {uuid} from '@sanity/uuid'
import {performanceTestRunner, typingSpeed} from '../performance'
import {testSanityClient} from '../helpers'

const COMPARE_URL = 'https://test-studio.sanity.build'
const CURRENT_URL = process.env.BRANCH_DEPLOYMENT_URL || 'http://localhost:3333'

test.describe('Performance', () => {
  test('Typing speed test', async ({page}) => {
    const compareDoc = await testSanityClient.create({_type: 'stringsTest', _id: uuid()})
    const currentDoc = await testSanityClient.create({_type: 'stringsTest', _id: uuid()})

    const compareResult = await performanceTestRunner<number>({
      page,
      path: `/test/content/input-standard;stringsTest;${compareDoc._id}`,
      test: typingSpeed,
      url: COMPARE_URL,
    })

    const currentResult = await performanceTestRunner<number>({
      page,
      path: `/test/content/input-standard;stringsTest;${currentDoc._id}`,
      test: typingSpeed,
      url: CURRENT_URL,
    })

    await testSanityClient.delete(compareDoc._id)
    await testSanityClient.delete(currentDoc._id)

    expect(currentResult).toBeLessThanOrEqual(compareResult)
  })
})
