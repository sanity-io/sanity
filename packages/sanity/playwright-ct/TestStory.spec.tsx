import {expect, test, type ComponentFixtures} from '@playwright/experimental-ct-react'
import type {PlaywrightTestArgs, Locator} from '@playwright/test'
import React from 'react'

import {TestStory} from './TestStory'

test.use({viewport: {width: 1200, height: 1000}})

test.describe('Test story', () => {
  test('rendering should work', async ({mount, page}) => {
    const component = await mount(<TestStory />)

    const $button = await component.getByTestId('toggle')

    await expect(page.getByText('Testing')).toBeVisible()

    await $button.click({delay: 100})

    await expect(page.getByText('Enabled')).toBeVisible()
  })
})
