// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {render, act} from '@testing-library/react'
import {ThemeProvider, ToastProvider, studioTheme} from '@sanity/ui'
import type {Subject} from 'rxjs'
import documentStore from 'part:@sanity/base/datastore/document'
import client from 'part:@sanity/base/client'
import type {ClientConfig} from '@sanity/client'
import {ConfirmDeleteDialog} from '../'

jest.mock('part:@sanity/base/schema', () => {
  const createSchema = jest.requireActual('part:@sanity/base/schema-creator')
  return createSchema({
    types: [
      {
        name: 'foo',
        title: 'Foo',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })
})

jest.mock('part:@sanity/base/datastore/document', () => {
  const actualModule = jest.requireActual('part:@sanity/base/datastore/document').default
  const {Subject} = require('rxjs')
  const listenQuerySubject = new Subject()

  // partially mock the module
  return new Proxy(actualModule, {
    get: (target, property) => {
      switch (property) {
        case 'listenQuery': {
          return jest.fn(() => listenQuerySubject)
        }
        default: {
          return target[property]
        }
      }
    },
  })
})

jest.mock('part:@sanity/base/client', () => {
  const {NEVER, EMPTY, ReplaySubject, of: ofValue} = require('rxjs')
  const mockConfig: ClientConfig = {
    useCdn: false,
    projectId: 'mock-project-id',
    dataset: 'mock-dataset',
    apiVersion: '1',
  }

  const referencesSubject = new ReplaySubject(1)
  const existenceSubject = new ReplaySubject(1)

  const mockClient = {
    withConfig: () => mockClient,
    constructor: () => mockClient,
    config: (config: unknown) => (config ? mockClient : mockConfig),
    clone: () => mockClient,
    fetch: () => Promise.resolve(null),
    request: () => Promise.resolve(null),
    getDataUrl: (op: string, path: string) =>
      `/${op}/${mockConfig.dataset}/${path.replace(/^\//, '')}`,
    getUrl: (path: string) => `https://mock-project-id.api.sanity.io/v1${path}`,
    observable: {
      listen: () => NEVER,
      fetch: (query: string) => {
        return query.includes('secrets.sanity.sharedContent')
          ? ofValue([{_id: 'secrets.sanity.sharedContent.abc123', token: 'yes'}])
          : EMPTY
      },
      request: (options: {url: string} | {uri: string}) => {
        const url = 'url' in options ? options.url : options.uri
        return url.includes('/data/references') ? referencesSubject : existenceSubject
      },
    },
    listen: () => NEVER,
  }

  return mockClient
})

jest.mock('@sanity/base/preview', () => {
  const actualModule = jest.requireActual('@sanity/base/preview')

  const MockSanityPreview = jest.fn(({value}) => (
    <div data-testid="mock-preview">{JSON.stringify({value})}</div>
  ))

  // partially mock the module
  return new Proxy(actualModule, {
    get: (target, property) => {
      switch (property) {
        case 'SanityPreview': {
          return MockSanityPreview
        }
        default: {
          return target[property]
        }
      }
    },
  })
})

jest.mock('../../../contexts/paneRouter', () => {
  const actualModule = jest.requireActual('../../../contexts/paneRouter')

  const MockSanityPreview = jest.fn(({value}) => (
    <div data-testid="mock-preview">{JSON.stringify({value})}</div>
  ))

  function useMockPaneRouter() {
    return {
      ReferenceChildLink: MockSanityPreview,
    }
  }

  // partially mock the module
  return new Proxy(actualModule, {
    get: (target, property) => {
      switch (property) {
        case 'usePaneRouter': {
          return useMockPaneRouter
        }
        default: {
          return target[property]
        }
      }
    },
  })
})

describe('ConfirmDeleteDialog', () => {
  it('loads referring documents and shows both internal and cross-dataset references', async () => {
    const listenQuery$ = documentStore.listenQuery() as Subject<any>
    const refsRequest$ = client.observable.request({url: '/data/references'}) as Subject<any>
    const existenceRequest$ = client.observable.request({url: '/doc/'}) as Subject<any>

    const {findByTestId, queryByTestId, queryByText} = render(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ConfirmDeleteDialog
            id="example-docment"
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
            type="author"
            action="Unpublish"
          />
        </ToastProvider>
      </ThemeProvider>
    )

    // assert the loading container shows up
    await findByTestId('loading-container')

    act(() => {
      listenQuery$.next({
        totalCount: 2,
        references: [
          {_id: 'foo', _type: 'foo'},
          {_id: 'bar', _type: 'invalidType'},
        ],
      })

      existenceRequest$.next({
        omitted: [],
      })

      refsRequest$.next({
        totalCount: 1,
        references: [
          {
            documentId: 'test-id',
            projectId: 'test-project',
            datasetName: 'test-dataset',
          },
        ],
      })
    })

    // when the loading is finished then the confirm-delete-button is rendered
    await findByTestId('confirm-delete-button')

    const internalReferences = queryByTestId('internal-references')
    expect(internalReferences).toContainElement(queryByTestId('mock-preview'))
    expect(internalReferences).toContainElement(queryByText('Preview Unavailable'))

    const crossDatasetReferences = queryByTestId('cross-dataset-references')
    expect(crossDatasetReferences).toContainElement(queryByText('1 document in another dataset'))
    expect(crossDatasetReferences).toContainElement(queryByText('Dataset: test-dataset'))
  })

  it('shows a fallback dialog if an error occurs', async () => {
    const listenQuery$ = documentStore.listenQuery() as Subject<any>

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    const {findByTestId} = render(
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <ConfirmDeleteDialog
            id="example-docment"
            onCancel={jest.fn()}
            onConfirm={jest.fn()}
            type="author"
            action="Unpublish"
          />
        </ToastProvider>
      </ThemeProvider>
    )

    act(() => {
      listenQuery$.error(new Error('test error'))
    })

    await findByTestId('confirm-delete-error-dialog')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2)

    // Error: Uncaught [Error: test error]
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error: Uncaught [Error: test error]')
    // The above error occurred in the <ConfirmDeleteDialog> component
    expect(consoleErrorSpy.mock.calls[1][0]).toContain('<ConfirmDeleteDialog>')

    consoleErrorSpy.mockRestore()
  })
})
