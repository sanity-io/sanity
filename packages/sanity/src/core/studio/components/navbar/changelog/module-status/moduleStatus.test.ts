import type {SanityClient} from '@sanity/client'
import {of, Observable, asyncScheduler, lastValueFrom} from 'rxjs'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {act} from 'react-dom/test-utils'
import basePkg from '../../../../../../../package.json'
import {checkModuleStatus} from './moduleStatus'
import {useModuleStatus} from './hooks'
import {VersionsResponse} from './types'

const defaults = {isSupported: true, isUpToDate: true, outdated: []}

describe('module status', () => {
  test('can fetch module status from api', async () => {
    const installed = {sanity: basePkg.version}
    const mockClient = getMockClient()
    const status = await lastValueFrom(
      checkModuleStatus({
        client: mockClient,
        moduleVersions: installed,
      })
    )

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status).toMatchObject({...defaults, installed})
  })

  test('prevents multiple calls to api while resolving', async () => {
    const installed = {sanity: '2.1337.0'}
    const mockClient = getMockClient()

    const call1 = checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    })

    const call2 = checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    })

    const [status1, status2] = await Promise.all([lastValueFrom(call1), lastValueFrom(call2)])

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status1).toMatchObject({...defaults, installed})
    expect(status1).toBe(status2) // Exact same (referentially identical) value
  })

  test('uses cache after first resolve', async () => {
    const installed = {sanity: '2.1338.0'}
    const mockClient = getMockClient()

    const status1 = await lastValueFrom(
      checkModuleStatus({
        client: mockClient,
        moduleVersions: installed,
      })
    )

    const status2 = await lastValueFrom(
      checkModuleStatus({
        client: mockClient,
        moduleVersions: installed,
      })
    )

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status1).toMatchObject({...defaults, installed})
    expect(status1).toBe(status2) // Exact same (referentially identical) value
  })
})

describe('useModuleStatus', () => {
  let container: HTMLElement | null = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (container) {
      document.body.removeChild(container)
      container = null
    }
  })

  test('has loading state', async () => {
    const installed = {sanity: '3.0.0-rc.3'}
    const mockClient = getMockClient()

    function StatusDumper() {
      const status = useModuleStatus({
        client: mockClient,
        moduleVersions: installed,
      })

      return React.createElement('pre', {}, JSON.stringify(status))
    }

    act(() => {
      createRoot(container!).render(React.createElement(StatusDumper))
    })

    expect(container!.textContent).toMatchInlineSnapshot(
      `"{\\"isLoading\\":true,\\"error\\":null}"`
    )
    await act(nextTick)
    expect(container!.textContent).toMatchInlineSnapshot(
      `"{\\"isLoading\\":false,\\"value\\":{\\"isSupported\\":true,\\"isUpToDate\\":true,\\"outdated\\":[],\\"installed\\":{\\"sanity\\":\\"3.0.0-rc.3\\"}},\\"error\\":null}"`
    )
  })

  test('has no loading state when cached', async () => {
    const installed = {sanity: '3.0.1'}
    const mockClient = getMockClient()
    const options = {
      client: mockClient,
      moduleVersions: installed,
    }

    // Prepare in order to cache result
    await lastValueFrom(checkModuleStatus(options))
    await nextTick()

    function StatusDumper() {
      const status = useModuleStatus(options)
      return React.createElement('pre', {}, JSON.stringify(status))
    }

    act(() => {
      createRoot(container!).render(React.createElement(StatusDumper))
    })

    expect(container!.textContent).toMatchInlineSnapshot(
      `"{\\"isLoading\\":false,\\"value\\":{\\"isSupported\\":true,\\"isUpToDate\\":true,\\"outdated\\":[],\\"installed\\":{\\"sanity\\":\\"3.0.1\\"}},\\"error\\":null}"`
    )
  })
})

function getMockClient(response?: Partial<VersionsResponse>): SanityClient {
  const responseBody = {...defaults, ...response}

  const request = jest.fn((options: {url: string}): Observable<VersionsResponse> => {
    expect(options.url).toBe('/versions')
    return of(responseBody, asyncScheduler)
  })

  const observable = {request} as unknown as SanityClient['observable']
  const mockClient = {observable} as SanityClient
  return mockClient
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}
