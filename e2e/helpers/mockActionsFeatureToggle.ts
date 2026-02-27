import {type Page} from '@playwright/test'

interface ActionsFeatureToggle {
  enabled: boolean
  compatibleStudioVersions: string
}

export function mockActionsFeatureToggle({
  response,
  page,
}: {
  response: ActionsFeatureToggle
  page: Page
}): ReturnType<Page['route']> {
  return page.route('**/data/actions/**', (route, request) => {
    if (request.method() !== 'GET') {
      return route.continue()
    }

    return route.fulfill({
      json: response,
    })
  })
}
