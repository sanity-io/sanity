import {type ClientConfig, type SanityClient} from '@sanity/client'
import type * as SanityClientModule from '@sanity/client'
import {act, render, screen, waitFor} from '@testing-library/react'
import {AddonDatasetContext, StudioErrorHandlerContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {ErrorBoundary} from '../../../../../ui-components/errorBoundary/ErrorBoundary'
import {type AddonDatasetContextValue} from '../../../../studio/addonDataset/types'
import {createRequestErrorChannel} from '../../../../studio/requestErrors/createRequestErrorChannel'
import {type RequestErrorClaim} from '../../../../studio/requestErrors/types'
import {TasksAddonWorkspaceProvider} from './TasksAddOnWorkspaceProvider'

const {respondToUsersMe} = vi.hoisted(() => ({respondToUsersMe: vi.fn<() => Response>()}))

// The add-on workspace builds its auth store clients with `createClient`, so its current user
// check is answered here, by the transport of real clients.
vi.mock('@sanity/client', async (importOriginal) => {
  const actual = await importOriginal<typeof SanityClientModule>()
  const fetchFromApi = async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : String(input)
    return url.includes('/users/me')
      ? respondToUsersMe()
      : Response.json({error: 'Not Found'}, {status: 404})
  }
  return {
    ...actual,
    createClient: (config: ClientConfig) =>
      actual.createClient({...config, maxRetries: 0, resolveFetch: () => fetchFromApi}),
  }
})

const currentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

function addonDatasetContext(dataset: string): AddonDatasetContextValue {
  return {
    client: {config: () => ({dataset})} as unknown as SanityClient,
    createAddonDataset: vi.fn(),
    error: null,
    isCreatingDataset: false,
    ready: true,
  }
}

describe('TasksAddonWorkspaceProvider', () => {
  it('hands a rate limited current user check to the studio error handler instead of throwing', async () => {
    respondToUsersMe
      .mockImplementationOnce(
        () =>
          new Response('Too Many Requests', {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {'content-type': 'text/plain', 'retry-after': '2'},
          }),
      )
      .mockImplementation(() => Response.json(currentUser))

    const channel = createRequestErrorChannel()
    const claims: (RequestErrorClaim | undefined)[] = []
    channel.claim$.subscribe((claim) => claims.push(claim))
    const onCatch = vi.fn()
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <StudioErrorHandlerContext.Provider value={channel}>
          <AddonDatasetContext.Provider value={addonDatasetContext('mock-data-set-comments')}>
            <ErrorBoundary onCatch={onCatch}>
              <TasksAddonWorkspaceProvider mode="create">
                <div data-testid="addon-workspace-children" />
              </TasksAddonWorkspaceProvider>
            </ErrorBoundary>
          </AddonDatasetContext.Provider>
        </StudioErrorHandlerContext.Provider>
      </TestProvider>,
    )

    await waitFor(() =>
      expect(claims.at(-1)).toMatchObject({
        type: 'rateLimited',
        retryAfterSeconds: 2,
        retryable: true,
      }),
    )
    expect(screen.queryByTestId('addon-workspace-children')).not.toBeInTheDocument()

    act(() => channel.retry())

    expect(await screen.findByTestId('addon-workspace-children')).toBeInTheDocument()
    expect(respondToUsersMe).toHaveBeenCalledTimes(2)
    expect(onCatch).not.toHaveBeenCalled()
  })
})
