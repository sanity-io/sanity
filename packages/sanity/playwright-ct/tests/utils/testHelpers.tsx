import {type ComponentFixtures} from '@playwright/experimental-ct-react'
import type {PlaywrightTestArgs, Locator, TestInfo} from '@playwright/test'

export const DEFAULT_TYPE_DELAY = 20

/**
 * The delay between key presses in milliseconds for fast typing. This is usually used for typing in the PTE.
 * The PTE normally need some time to process the input and sync its internal state with the document
 */
export const TYPE_DELAY_HIGH = 150

export type MountResult = Awaited<ReturnType<ComponentFixtures['mount']>>

/**
 * Get the platform name based on the project name.
 * @param projectName - The name of the project.
 * @returns The platform name or `null`.
 */
function getPlatformName(projectName: string): string | null {
  if (projectName.toLowerCase().includes('osx')) {
    return 'darwin'
  }

  if (projectName.toLowerCase().includes('windows')) {
    return 'win32'
  }

  return null
}

export function testHelpers({
  page,
  testInfo,
}: {
  page: PlaywrightTestArgs['page']
  testInfo: TestInfo
}) {
  const platformName = getPlatformName(testInfo.project.name) || process.platform
  return {
    /**
     * Focuses on the PTE and activates it with the space key.
     * @param testId - The data-testid attribute of the PTE.
     * @returns The located PTE element.
     */
    focusPTE: async (testId: string) => {
      const $pteField: Locator = page.getByTestId(testId)
      // Focus PTE and activate with space key
      await $pteField.getByTestId('activate-overlay').focus()
      await page.keyboard.press('Space')

      // Focus PTE by clicking manually
      // await $pteLocator.getByTestId('activate-overlay').click({force: true})
      return $pteField
    },
    /**
     * Gets the appropriate modifier key for the current platform.
     * @returns The modifier key name ('Meta' for macOS, 'Control' for other platforms).
     */
    getModifierKey: () => {
      if ((platformName || process.platform) === 'darwin') {
        return 'Meta'
      }
      return 'Control'
    },
    /**
     * Types text with a delay using `page.keyboard.type`. Default delay emulates a human typing.
     * @param input - The text to be typed.
     * @param delay - (Optional) The delay between key presses in milliseconds.
     */
    typeWithDelay: async (input: string, delay?: number) => {
      await page.keyboard.type(input, {delay: delay || DEFAULT_TYPE_DELAY})
    },
    /**
     * Types text in the PTE by firing a `beforeinput` event with the input, with a delay after.
     * The built-in `page.keyboard.type()` function fires each character async. This could lead to
     * characters being lost, or ending up in the wrong order.
     * @param input - The text to be typed.
     * @param delay - (Optional) The delay between key presses in milliseconds.
     */
    typeInPTEWithDelay: async (input: string, locator: Locator, delay?: number) => {
      await locator.evaluate((el, value) => {
        el.dispatchEvent(
          new window.InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: value,
          })
        )
      }, input)

      await new Promise((resolve) => setTimeout(resolve, delay || DEFAULT_TYPE_DELAY))
    },
  }
}

/**
 * Maps a test status in Browserstack to a session status.
 * @param status - The test status.
 * @returns The corresponding session status ('passed' or 'failed').
 */
function mapTestStatusToSessionStatus(status: string) {
  const successStatuses = ['passed', 'skipped'] //
  return successStatuses.includes(status) ? 'passed' : 'failed'
}

/**
 * Sets the session status in Browserstack based on the test status and error information.
 * @param page - The Playwright test page.
 * @param testInfo - Information about the current test.
 */
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

/**
 * Sets the session test name in Browserstack based on the test information.
 * @param page - The Playwright test page.
 * @param testInfo - Information about the current test.
 */
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
