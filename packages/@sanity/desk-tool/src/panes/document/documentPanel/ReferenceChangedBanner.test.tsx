// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom'
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import {RouterProvider} from '@sanity/base/router'
import {toString as pathToString} from '@sanity/util/paths'
import {AvailabilityReason, unstable_observePathsDocumentPair} from '@sanity/base/_internal'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {of} from 'rxjs'
import {PaneRouterProvider} from '../../../contexts/paneRouter'
import deskTool from '../../../_parts/base-tool'
import {ReferenceChangedBanner} from './ReferenceChangedBanner'

beforeEach(() => {
  jest.resetAllMocks()
  ;(unstable_observePathsDocumentPair as jest.Mock).mockImplementation(() =>
    of({
      id: 'parent-id',
      type: 'string | null',
      draft: {
        availability: {
          available: true,
          reason: AvailabilityReason.READABLE,
        },
        snapshot: {
          _id: 'parent-id',
          _type: 'example-type',
          exampleReferenceField: {
            _ref: 'example-id',
          },
        },
      },
      published: {
        availability: {
          available: false,
          reason: AvailabilityReason.NOT_FOUND,
        },
      },
    })
  )
})

jest.mock('@sanity/base/_internal', () => {
  const actualModule = jest.requireActual('@sanity/base/_internal')
  const Rx = require('rxjs')

  const mockObservePathsDocumentPair = jest.fn()

  return new Proxy(actualModule, {
    get: (target, property) => {
      switch (property) {
        case 'unstable_observePathsDocumentPair': {
          return mockObservePathsDocumentPair
        }
        default: {
          return target[property]
        }
      }
    },
  })
})

describe('ReferenceChangedBanner', () => {
  it('appears when there is an ID mismatch', async () => {
    const params = {
      parentRefPath: pathToString(['exampleReferenceField']),
    }

    const {findByTestId} = render(
      <ThemeProvider scheme="light" theme={studioTheme}>
        <RouterProvider
          onNavigate={jest.fn()}
          router={deskTool.router}
          state={{
            panes: [
              [{id: 'parent-id'}],
              // this ID is different from the mock
              [{id: 'different-id', params}],
            ],
          }}
        >
          <PaneRouterProvider
            flatIndex={2}
            index={2}
            siblingIndex={0}
            params={params}
            payload={undefined}
          >
            <ReferenceChangedBanner />
          </PaneRouterProvider>
        </RouterProvider>
      </ThemeProvider>
    )

    await findByTestId('reference-changed-banner', undefined, {timeout: 5 * 1000})
  })

  it('disappears when the IDs match', async () => {
    const params = {
      parentRefPath: pathToString(['exampleReferenceField']),
    }

    const {queryByTestId} = render(
      <ThemeProvider scheme="light" theme={studioTheme}>
        <RouterProvider
          onNavigate={jest.fn()}
          router={deskTool.router}
          state={{
            panes: [
              [{id: 'parent-id'}],
              // this ID is the same as the mock
              [{id: 'example-id', params}],
            ],
          }}
        >
          <PaneRouterProvider
            flatIndex={2}
            index={2}
            siblingIndex={0}
            params={params}
            payload={undefined}
          >
            <ReferenceChangedBanner />
          </PaneRouterProvider>
        </RouterProvider>
      </ThemeProvider>
    )

    await waitFor(() => expect(unstable_observePathsDocumentPair).toHaveBeenCalledTimes(1))
    expect(queryByTestId('reference-changed-banner')).not.toBeInTheDocument()
  })
})
