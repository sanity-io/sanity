import type {SanityClient} from '@sanity/client'
import {of, Observable, asyncScheduler} from 'rxjs'
import React from 'react'
import ReactDOM from 'react-dom'
import {act} from 'react-dom/test-utils'
import basePkg from '../package.json'
import {checkModuleStatus, useModuleStatus, VersionsResponse} from '../src/module-status'

const defaults = {isSupported: true, isUpToDate: true, outdated: []}

describe('module status', () => {
  test('can fetch module status from api', async () => {
    const installed = {'@sanity/base': basePkg.version}
    const mockClient = getMockClient()
    const status = await checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    }).toPromise()

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status).toMatchObject({...defaults, installed})
  })

  test('prevents multiple calls to api while resolving', async () => {
    const installed = {'@sanity/base': '2.1337.0'}
    const mockClient = getMockClient()

    const call1 = checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    })

    const call2 = checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    })

    const [status1, status2] = await Promise.all([call1.toPromise(), call2.toPromise()])

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status1).toMatchObject({...defaults, installed})
    expect(status1).toBe(status2) // Exact same (referentially identical) value
  })

  test('uses cache after first resolve', async () => {
    const installed = {'@sanity/base': '2.1338.0'}
    const mockClient = getMockClient()

    const status1 = await checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    }).toPromise()

    const status2 = await checkModuleStatus({
      client: mockClient,
      moduleVersions: installed,
    }).toPromise()

    expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
    expect(status1).toMatchObject({...defaults, installed})
    expect(status1).toBe(status2) // Exact same (referentially identical) value
  })
})

describe('useModuleStatus', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container = null
  })

  test('has loading state', async () => {
    const installed = {'@sanity/base': '3.0.0'}
    const mockClient = getMockClient()

    function StatusDumper() {
      const status = useModuleStatus({
        client: mockClient,
        moduleVersions: installed,
      })

      return React.createElement('pre', {}, JSON.stringify(status))
    }

    act(() => {
      ReactDOM.render(React.createElement(StatusDumper), container)
    })

    expect(container.textContent).toMatchInlineSnapshot(`"{\\"isLoading\\":true}"`)
    await act(nextTick)
    expect(container.textContent).toMatchInlineSnapshot(
      `"{\\"isLoading\\":false,\\"value\\":{\\"isSupported\\":true,\\"isUpToDate\\":true,\\"outdated\\":[],\\"installed\\":{\\"@sanity/base\\":\\"3.0.0\\"}}}"`
    )
  })

  test('has no loading state when cached', async () => {
    const installed = {'@sanity/base': '3.0.1'}
    const mockClient = getMockClient()
    const options = {
      client: mockClient,
      moduleVersions: installed,
    }

    // Prepare in order to cache result
    await checkModuleStatus(options).toPromise()
    await nextTick()

    function StatusDumper() {
      const status = useModuleStatus(options)
      return React.createElement('pre', {}, JSON.stringify(status))
    }

    act(() => {
      ReactDOM.render(React.createElement(StatusDumper), container)
    })

    expect(container.textContent).toMatchInlineSnapshot(
      `"{\\"isLoading\\":false,\\"value\\":{\\"isSupported\\":true,\\"isUpToDate\\":true,\\"outdated\\":[],\\"installed\\":{\\"@sanity/base\\":\\"3.0.1\\"}}}"`
    )
  })
})

function getMockClient(response?: Partial<VersionsResponse>): SanityClient {
  const responseBody = {...defaults, ...response}

  const request = jest.fn(
    (options: {url: string}): Observable<VersionsResponse> => {
      expect(options.url).toBe('/versions')
      return of(responseBody, asyncScheduler)
    }
  )

  const observable = ({request} as unknown) as SanityClient['observable']
  const mockClient = {observable} as SanityClient
  return mockClient
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}
