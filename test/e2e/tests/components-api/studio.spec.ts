import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Studio Components API:', () => {
  test('studio.components.layout', async ({page}) => {
    page.goto('/content')
    await expect(
      page
        .getByTestId('child-parent-config-studio-layout')
        .getByTestId('parent-config-studio-layout')
        .getByTestId('studio-layout'),
    ).toBeVisible()
  })

  test('studio.components.navbar', async ({page}) => {
    page.goto('/content')
    await expect(
      page
        .getByTestId('child-parent-config-studio-navbar')
        .getByTestId('parent-config-studio-navbar')
        .getByTestId('studio-navbar'),
    ).toBeVisible()
  })

  test('studio.components.toolMenu', async ({page}) => {
    page.goto('/content')
    await expect(
      page
        .getByTestId('child-parent-config-studio-tool-menu')
        .getByTestId('parent-config-studio-tool-menu')
        .getByTestId('tool-collapse-menu'),
    ).toBeVisible()
  })
})
