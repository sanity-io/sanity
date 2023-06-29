import {expect, type ComponentFixtures} from '@playwright/experimental-ct-react'
import type {PlaywrightTestArgs, Locator, TestInfo} from '@playwright/test'
export const DEFAULT_TYPE_DELAY = 150

export type MountResult = Awaited<ReturnType<ComponentFixtures['mount']>>

function getPlatformName(projectName: string): string | null {
  if (projectName.toLowerCase().includes('osx')) {
    return 'darwin'
  }

  if (projectName.toLowerCase().includes('windows')) {
    return 'win32'
  }

  return null
  //return 'linux'
  /*
  'aix'
  'darwin'
  'freebsd'
  'linux'
  'openbsd'
  'sunos'
  'win32'
  */
}

function normalizeKey(keyCombination: string, platformName?: string | null) {
  const keyMap: Record<string, string> = {
    Meta: (platformName || process.platform) === 'darwin' ? 'Meta' : 'Control',
    Control: 'Control',
    Alt: 'Alt',
    Shift: 'Shift',
  }

  const keys = keyCombination.split('+').map((key) => keyMap[key] || key)

  return keys.join('+')
}
export function testHelpers({
  page,
  component,
  testInfo,
}: {
  page: PlaywrightTestArgs['page']
  testInfo: TestInfo
  component: MountResult
}) {
  const platformName = getPlatformName(testInfo.project.name)
  return {
    type: async (input: string, delay?: number) =>
      page.keyboard.type(input, {delay: delay || DEFAULT_TYPE_DELAY}),
    toggleShortcut: async (input: string, callback: () => Promise<void>) => {
      await page.keyboard.press(normalizeKey(input, platformName), {delay: DEFAULT_TYPE_DELAY})
      // eslint-disable-next-line callback-return
      await callback()
      await page.keyboard.press(normalizeKey(input, platformName), {delay: DEFAULT_TYPE_DELAY})
    },
    press: async (input: string, delay?: number) =>
      page.keyboard.press(normalizeKey(input, platformName), {delay: delay || DEFAULT_TYPE_DELAY}),
    toolbarButton: async (buttonLabel: string) =>
      page
        .getByRole('button')
        .filter({hasText: buttonLabel})
        .press('Enter', {delay: DEFAULT_TYPE_DELAY}),
    toolbarButtonWithSelector: async (locator: string, delay?: number) =>
      page
        .getByRole('button')
        .filter({has: page.locator(locator)})
        .press('Enter', {delay: delay || DEFAULT_TYPE_DELAY}),
    goToPTE: async (
      $pteTextboxLocator: Locator = page.getByTestId('field-body').getByRole('textbox')
    ) => {
      // We wait for rendering of string inputs
      await expect(
        page.getByTestId('field-title').getByTestId('string-input').first()
      ).toBeVisible()
      await expect(
        page.getByTestId('field-title').getByTestId('string-input').first()
      ).toBeFocused()

      // Wait for rendering of PTE
      await expect(
        page.getByTestId('field-body').getByRole('textbox').first().filter({hasText: 'Empty'})
      ).toBeVisible()

      // Tab over the required field, down to the PTE input.
      await page.keyboard.press('Tab+Tab', {delay: 200})

      await expect(page.getByTestId('field-body').locator(':focus')).toBeFocused()

      // Textbox should now be focused so we can active PTE
      await expect(
        page.getByTestId('field-body').locator(':focus', {hasText: 'to activate'})
      ).toBeFocused()

      // Activate the input so we can type in it
      await page.keyboard.press('Space', {delay: DEFAULT_TYPE_DELAY})

      // Textbox should now be focused so we can type
      await expect($pteTextboxLocator.filter({hasText: 'Empty'})).toBeFocused()
    },
  }
}

function mapTestStatusToSessionStatus(status: string) {
  const successStatuses = ['passed', 'skipped'] //
  return successStatuses.includes(status) ? 'passed' : 'failed'
}

export async function setSessionStatus(page: PlaywrightTestArgs['page'], testInfo: TestInfo) {
  const {status, error} = testInfo
  const sessionStatus = mapTestStatusToSessionStatus(status || 'failed')

  // eslint-disable-next-line no-nested-ternary
  const reason = error ? error.message : status === 'skipped' ? 'skipped' : 'n/a'

  const executionCommand = `browserstack_executor: ${JSON.stringify({
    action: 'setSessionStatus',
    arguments: {
      status: sessionStatus,
      reason: reason,
    },
  })}`

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await page.evaluate((_) => {}, executionCommand)
}

export async function setSessionTestName(page: PlaywrightTestArgs['page'], testInfo: TestInfo) {
  const executionCommand = `browserstack_executor: ${JSON.stringify({
    action: 'setSessionName',
    arguments: {
      name: testInfo.title,
    },
  })}`

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await page.evaluate((_) => {}, executionCommand)
}
