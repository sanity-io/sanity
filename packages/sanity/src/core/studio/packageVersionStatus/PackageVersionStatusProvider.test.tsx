import {render, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'

import {PackageVersionStatusProvider} from './PackageVersionStatusProvider'

const PROP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/app-from-prop/t1754072932/%5E5.20.1/sanity'
const DOCUMENT_URL =
  'https://sanity-cdn.com/v1/modules/by-app/app-from-document/t1754072932/%5E5.20.1/sanity'

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json({packageVersion: '5.21.0'}),
  )
  const script = document.createElement('script')
  script.type = 'importmap'
  script.textContent = JSON.stringify({imports: {sanity: DOCUMENT_URL}})
  document.head.append(script)
})

afterEach(() => {
  document.head.replaceChildren()
  vi.restoreAllMocks()
})

const byAppRequests = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([url]) => String(url))
    .filter((url) => url.includes('/by-app/'))

it('polls the import map URL it was given instead of the document import map', async () => {
  render(
    <PackageVersionStatusProvider importMapUrl={PROP_URL}>{null}</PackageVersionStatusProvider>,
  )

  await waitFor(() =>
    expect(byAppRequests()).toEqual([expect.stringContaining('/by-app/app-from-prop/')]),
  )
})

it('polls the document import map URL when no import map URL is given', async () => {
  render(<PackageVersionStatusProvider>{null}</PackageVersionStatusProvider>)

  await waitFor(() =>
    expect(byAppRequests()).toEqual([expect.stringContaining('/by-app/app-from-document/')]),
  )
})
