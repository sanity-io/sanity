import {type ComponentFixtures} from '@playwright/experimental-ct-react'
import type {PlaywrightTestArgs, Locator, TestInfo} from '@playwright/test'

export const DEFAULT_TYPE_DELAY = 20

export type MountResult = Awaited<ReturnType<ComponentFixtures['mount']>>

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
  const platformName = getPlatformName(testInfo.project.name)
  return {
    focusPTE: async (testId: string) => {
      const $pteField: Locator = page.getByTestId(testId)
      // Focus PTE and activate with space key
      await $pteField.getByTestId('activate-overlay').focus()
      await page.keyboard.press('Space')

      // Focus PTE by clicking manually
      // await $pteLocator.getByTestId('activate-overlay').click({force: true})
      return $pteField
    },
    getModifierKey: () => {
      if ((platformName || process.platform) === 'darwin') {
        return 'Meta'
      }
      return 'Control'
    },
    typeWithDelay: async (input: string, delay?: number) => {
      await page.keyboard.type(input, {delay: delay || DEFAULT_TYPE_DELAY})
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
