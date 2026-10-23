import {render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

const MODULE_URL = 'https://sanity-cdn.com/v1/modules/by-app/app1/t1754072932/%5E5.20.1/sanity'
const IMPORT_MAP_URL = 'https://sanity-cdn.com/v1/modules/by-app/app2/t1754072932/%5E5.20.1/sanity'

beforeEach(() => {
  vi.resetModules()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
    Response.json(
      String(url).includes('/by-app/')
        ? {packageVersion: '5.21.0'}
        : {latest: '5.22.0', packageVersion: '5.22.0'},
    ),
  )
})

afterEach(() => {
  document.head.replaceChildren()
  vi.restoreAllMocks()
})

async function renderProvider(importMapUrl?: string) {
  const {PackageVersionStatusProvider} = await import('./PackageVersionStatusProvider')
  const {usePackageVersionStatus} = await import('./usePackageVersionStatus')

  function StatusProbe() {
    const {autoUpdatingVersion, isAutoUpdating, versionCheckStatus} = usePackageVersionStatus()
    return (
      <output
        data-auto-updating={isAutoUpdating}
        data-auto-updating-version={autoUpdatingVersion?.version}
        data-checked={Boolean(versionCheckStatus.lastCheckedAt)}
        data-testid="status"
      />
    )
  }

  render(
    <PackageVersionStatusProvider importMapUrl={importMapUrl}>
      <StatusProbe />
    </PackageVersionStatusProvider>,
  )
  await waitFor(() => expect(screen.getByTestId('status')).toHaveAttribute('data-checked', 'true'))

  return screen.getByTestId('status')
}

function addImportMap(sanity: string) {
  const script = document.createElement('script')
  script.type = 'importmap'
  script.textContent = JSON.stringify({imports: {sanity}})
  document.head.append(script)
}

const byAppRequests = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([url]) => String(url))
    .filter((url) => url.includes('/by-app/'))

it('auto-updates from the import map URL it was given, over the document import map', async () => {
  addImportMap(IMPORT_MAP_URL)

  const status = await renderProvider(MODULE_URL)

  expect(status).toHaveAttribute('data-auto-updating', 'true')
  expect(status).toHaveAttribute('data-auto-updating-version', '5.21.0')
  expect(byAppRequests()).toEqual([
    expect.stringMatching(/\/by-app\/app1\/t\d+\/\^5\.20\.1\/sanity$/),
  ])
})

it('auto-updates from the document import map when no import map URL is given', async () => {
  addImportMap(IMPORT_MAP_URL)

  const status = await renderProvider()

  expect(status).toHaveAttribute('data-auto-updating', 'true')
  expect(byAppRequests()).toEqual([expect.stringMatching(/\/by-app\/app2\//)])
})
