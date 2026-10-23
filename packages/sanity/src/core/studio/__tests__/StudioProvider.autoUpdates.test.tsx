import {render, waitFor} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {createMockAuthStore} from '../../store/auth/mock/createMockAuthStore'
import {StudioProvider} from '../StudioProvider'

afterEach(() => {
  vi.restoreAllMocks()
})

it(
  'polls the import map URL it was given for the auto-updating version',
  {timeout: 30_000},
  async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json({packageVersion: '5.21.0'}))
    const config = {
      projectId: 'test',
      dataset: 'test',
      schema: {types: []},
      auth: createMockAuthStore({client: createMockSanityClientAsClient(), currentUser: null}),
    }

    render(
      <StudioProvider
        config={config}
        unstable_noAuthBoundary
        unstable_importMapUrl="https://sanity-cdn.com/v1/modules/by-app/app1/t1754072932/%5E5.20.1/sanity"
      >
        {null}
      </StudioProvider>,
    )

    await waitFor(
      () =>
        expect(fetch.mock.calls.map(([url]) => String(url))).toContainEqual(
          expect.stringMatching(/\/by-app\/app1\/t\d+\/\^5\.20\.1\/sanity$/),
        ),
      {timeout: 15_000},
    )
  },
)
