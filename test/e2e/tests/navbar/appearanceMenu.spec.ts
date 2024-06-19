import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const COLOR_SCHEME_KEY = 'sanityStudio:ui:colorScheme'

//some flakiness around local storage initial state, so add timeout and isolate
test('default color scheme is system', async ({page, baseURL}) => {
  await page.goto(baseURL ?? '/test/content')
  await page.waitForTimeout(2000)
  const localStorage = await page.evaluate(() => window.localStorage)
  expect(localStorage[COLOR_SCHEME_KEY]).toBe('system')
})

test('color scheme changes and persists', async ({page, baseURL}) => {
  await page.goto(baseURL ?? '/test/content')

  await page.locator(`[id='user-menu']`).click()
  await expect(await page.getByTestId('user-menu')).toBeVisible()
  await expect(await page.getByTestId('color-scheme-dark')).toBeVisible()
  await page.getByTestId('color-scheme-dark').click()

  const darkModeLocalStorage = await page.evaluate(() => window.localStorage)

  expect(darkModeLocalStorage[COLOR_SCHEME_KEY]).toBe('dark')

  await page.locator(`[id='user-menu']`).click()
  await expect(await page.getByTestId('user-menu')).toBeVisible()
  await expect(await page.getByTestId('color-scheme-light')).toBeVisible()
  await page.getByTestId('color-scheme-light').click()

  const lightModeLocalStorage = await page.evaluate(() => window.localStorage)
  expect(lightModeLocalStorage[COLOR_SCHEME_KEY]).toBe('light')

  await page.goto('https://example.com')
  await page.goto(baseURL ?? '/test/content')
  const postNavigationLocalStorage = await page.evaluate(() => window.localStorage)
  //also include going to other studio / project id?
  expect(postNavigationLocalStorage[COLOR_SCHEME_KEY]).toBe('light')
})
