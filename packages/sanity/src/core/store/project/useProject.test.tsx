import {ClientError} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {firstValueFrom, of, throwError} from 'rxjs'
import {StudioErrorHandlerContext} from 'sanity/_singletons'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createRequestErrorChannel} from '../../studio/requestErrors/createRequestErrorChannel'
import {type StudioErrorHandler} from '../../studio/requestErrors/types'
import {useProjectStore} from '../datastores'
import {type ProjectData, type ProjectStore} from './types'
import {useProject} from './useProject'

vi.mock('../datastores', () => ({useProjectStore: vi.fn()}))

const projectData = {id: 'abc123', displayName: 'Test project'} as ProjectData

function sessionExpiredError(): ClientError {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {
      error: 'Unauthorized',
      errorCode: 'SIO-401-AEX',
      message: 'Session is expired, please re-authenticate',
    },
    url: 'https://abc123.api.sanity.io/v1/projects/abc123',
    method: 'GET',
  } as never)
}

function setup(get: ProjectStore['get'], errorHandler?: StudioErrorHandler) {
  vi.mocked(useProjectStore).mockReturnValue({get} as ProjectStore)
  const wrapper = ({children}: {children: ReactNode}) => (
    <StudioErrorHandlerContext.Provider value={errorHandler ?? null}>
      {children}
    </StudioErrorHandlerContext.Provider>
  )
  return renderHook(() => useProject(), {wrapper})
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useProject', () => {
  it('emits the fetched project data', async () => {
    const {result} = setup(() => of(projectData))
    await waitFor(() => expect(result.current.value).toEqual(projectData))
  })

  it('delegates a session-expired 401 to the error channel (unauthorized claim)', async () => {
    const channel = createRequestErrorChannel()
    const {result} = setup(() => throwError(() => sessionExpiredError()), channel)
    await waitFor(async () =>
      expect(await firstValueFrom(channel.claim$)).toMatchObject({
        type: 'unauthorized',
        projectId: 'abc123',
      }),
    )
    expect(result.current.value).toBeNull()
  })

  it('re-runs the fetch when the error dialog retries', async () => {
    const channel = createRequestErrorChannel()
    const get = vi
      .fn<ProjectStore['get']>()
      .mockReturnValueOnce(
        throwError(() => new ClientError({statusCode: 429, headers: {}, body: {}} as never)),
      )
      .mockReturnValueOnce(of(projectData))
    const {result} = setup(get, channel)
    await waitFor(async () =>
      expect(await firstValueFrom(channel.claim$)).toMatchObject({type: 'rateLimited'}),
    )
    act(() => channel.retry())
    await waitFor(() => expect(result.current.value).toEqual(projectData))
    expect(get).toHaveBeenCalledTimes(2)
  })

  // Note: errors the channel does NOT claim (caller-domain 4xx, etc.) are
  // intentionally left unhandled by the hook — they propagate through
  // rxjs's unhandled-error path so they stay visible to error monitoring.
})
