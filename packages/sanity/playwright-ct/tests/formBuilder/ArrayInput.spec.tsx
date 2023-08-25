import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../utils/testHelpers'
import ArrayInputStory from './ArrayInputStory'

test.use({viewport: {width: 1200, height: 1000}})

test.describe('Tag layout', () => {
  test('Pressing enter should create inline tags', async ({mount, page}) => {
    const {typeWithDelay} = testHelpers({page})
    const component = await mount(<ArrayInputStory />)
    const $field = component.getByTestId('field-tags')
    const tags = $field.locator('[data-ui="Tag"]')
    await $field.getByRole('textbox').focus()

    await typeWithDelay('abc')
    await page.keyboard.press('Enter')
    await typeWithDelay('123')
    await page.keyboard.press('Enter')

    // Assertion: Show tag elements with text in exact order
    await expect(tags).toHaveText(['abc', '123'])
  })
})
