/* eslint-disable max-nested-callbacks */
/// <reference types="@sanity/types/parts" />

import * as Rx from 'rxjs'
import * as operators from 'rxjs/operators'
import {render, act} from '@testing-library/react'
import React, {useEffect, useMemo, useState} from 'react'
import {RouterProvider, useRouter} from '@sanity/base/router'
import {LayerProvider, ThemeProvider, studioTheme, ToastProvider, useElementRect} from '@sanity/ui'
import type {CurrentUser} from '@sanity/types'
import type {PaneNode, RouterPaneGroup, RouterPaneSiblingContext} from './types'
import {DeskTool} from './DeskTool'
import deskTool from './_parts/base-tool'
import {LOADING_PANE} from './constants'

const isNonNullable = <T,>(t: T): t is NonNullable<T> => t !== null && t !== undefined

jest.mock('part:@sanity/base/authentication-fetcher', () => {
  const mockUser: CurrentUser = {
    id: 'mock-user',
    name: 'mock user',
    email: 'mockUser@example.com',
    role: '',
    roles: [],
  }

  return {
    getCurrentUser: () => Promise.resolve(mockUser),
  }
})

jest.mock('part:@sanity/base/schema', () => {
  const createSchema = jest.requireActual('part:@sanity/base/schema-creator')

  return createSchema({
    name: 'mockSchema',
    types: [
      {
        name: 'myType',
        title: 'Mock Document',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })
})

jest.mock('part:@sanity/base/grants', () => {
  const {of} = jest.requireActual('rxjs') as typeof import('rxjs')
  return {
    checkDocumentPermission: () => of({granted: true, reason: ''}),
  }
})

jest.mock('@sanity/ui', () => {
  // causes `ResizeObserver` not found errors
  const sanityUi = jest.requireActual('@sanity/ui')
  return {...sanityUi, useElementRect: jest.fn()}
})

jest.mock('part:@sanity/desk-tool/structure?', () => {
  const mockChild: unknown = jest.fn((requestedId: string) => ({
    id: requestedId,
    child: mockChild,
  }))

  const module = {
    default: Promise.resolve({
      id: 'root',
      child: mockChild,
    }),
  }

  // this gets around the "Unknown structure export" warning
  Object.defineProperty(module, '__esModule', {
    value: true,
    enumerable: false,
    configurable: false,
  })

  Object.defineProperty(module, 'mockChild', {
    value: mockChild,
    enumerable: false,
    configurable: false,
  })

  return module
})

beforeEach(() => {
  ;(useElementRect as jest.Mock).mockImplementation(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 10000,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }))
})

interface CreateTestingProviderOptions {
  initialRouterState?: {panes?: RouterPaneGroup[]}
}

function createTestingProvider({initialRouterState = {}}: CreateTestingProviderOptions = {}) {
  /** a nice API for resolving promises outside of the promise scope */
  const createDeferredPromise = <T,>() => {
    let resolve!: (t: T) => void
    const promise = new Promise<T>((thisResolve) => (resolve = thisResolve))
    return Object.assign(promise, {resolve})
  }

  type Navigate = ReturnType<typeof useRouter>['navigate']
  const navigatePromise = createDeferredPromise<Navigate>()
  const paneChanges$ = new Rx.Subject<Array<PaneNode | typeof LOADING_PANE>>()

  const handlePaneChange = (panes: Array<PaneNode | typeof LOADING_PANE>) =>
    paneChanges$.next(panes)

  async function navigate(state: {panes: RouterPaneGroup[]}, options: {replace: boolean}) {
    const _navigate = await navigatePromise
    _navigate(state, options)
  }

  async function resolvedPanes(options: {
    collectChangesOverTime: true
  }): Promise<{changes: Array<PaneNode | typeof LOADING_PANE>[]}>
  async function resolvedPanes(): Promise<Array<PaneNode | typeof LOADING_PANE>>
  async function resolvedPanes(options?: {collectChangesOverTime: boolean}) {
    if (options?.collectChangesOverTime) {
      const changes = await paneChanges$
        .pipe(
          // collect values into a buffer until there is no emission after 500ms
          operators.buffer(paneChanges$.pipe(operators.debounceTime(500))),
          // then grab the first of this stream to complete it
          operators.first()
        )
        .toPromise()
      return {changes}
    }

    return paneChanges$
      .pipe(
        // take until there is no emission after 500ms
        operators.debounceTime(500),
        // then grab the first value to complete the stream
        operators.first()
      )
      .toPromise()
  }

  function GetNavigate(props: {children: React.ReactNode}) {
    const router = useRouter()

    useEffect(() => {
      navigatePromise.resolve(router.navigate)
    }, [router.navigate])

    return props.children as JSX.Element
  }

  function TestingProvider() {
    const [state, setState] = useState(initialRouterState)
    const location$ = useMemo(() => {
      const locationSubject = new Rx.Subject<string>()

      locationSubject
        .pipe(
          operators.map((url) =>
            deskTool.router.decode(new URL(url, window.location.href).pathname)
          ),
          operators.filter(isNonNullable)
        )
        .subscribe((e) => setState(e))

      return locationSubject
    }, [])

    const handleNavigate = location$.next.bind(location$)

    return (
      <RouterProvider
        router={deskTool.router}
        state={state}
        // eslint-disable-next-line react/jsx-no-bind
        onNavigate={handleNavigate}
      >
        <ThemeProvider scheme="light" theme={studioTheme}>
          <ToastProvider>
            <LayerProvider>
              <GetNavigate>
                <DeskTool
                  // eslint-disable-next-line react/jsx-no-bind
                  onPaneChange={handlePaneChange}
                />
              </GetNavigate>
            </LayerProvider>
          </ToastProvider>
        </ThemeProvider>
      </RouterProvider>
    )
  }

  const mockChild = jest.requireMock('part:@sanity/desk-tool/structure?')
    .mockChild as jest.MockedFunction<(...args: [string, RouterPaneSiblingContext]) => unknown>

  const dynamicChild = (requestedId: string) => ({
    id: requestedId,
    child: dynamicChild,
  })
  mockChild.mockImplementation(dynamicChild)

  return {TestingProvider, navigate, resolvedPanes, mockChild}
}

describe('DeskTool', () => {
  describe('pane resolution', () => {
    it('takes in state from the router and creates resolved panes', async () => {
      const {TestingProvider, resolvedPanes} = createTestingProvider({
        initialRouterState: {
          panes: [[{id: 'level1'}], [{id: 'level2'}]],
        },
      })

      await act(async () => {
        render(<TestingProvider />)

        await expect(resolvedPanes()).resolves.toMatchObject([
          {id: 'root'},
          {id: 'level1'},
          {id: 'level2'},
        ])
      })
    })

    it('works with split panes', async () => {
      const {TestingProvider, resolvedPanes} = createTestingProvider({
        initialRouterState: {
          panes: [
            [{id: 'level1'}],
            // this will create a spilt pane for level2
            [{id: 'level2'}, {id: 'level2'}],
          ],
        },
      })

      await act(async () => {
        render(<TestingProvider />)

        await expect(resolvedPanes()).resolves.toMatchObject([
          // note: the resolved panes are flat
          {id: 'root'},
          {id: 'level1'},
          // the split panes go one after the other
          {id: 'level2'},
          {id: 'level2'},
        ])
      })
    })

    it('resolves each pane from left to right, starting with loading panes first', async () => {
      const {TestingProvider, navigate, resolvedPanes} = createTestingProvider()

      await act(async () => {
        render(<TestingProvider />)

        await navigate(
          {
            panes: [
              [{id: 'level1'}],
              // split pane on level2
              [{id: 'level2'}, {id: 'level2'}],
            ],
          },
          {replace: true}
        )

        const {changes} = await resolvedPanes({collectChangesOverTime: true})
        expect(changes).toMatchObject([
          [{id: 'root'}, LOADING_PANE, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, {id: 'level2'}, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, {id: 'level2'}, {id: 'level2'}],
        ])
      })
    })

    it("stops resolving if the current structure doesn't have a child", async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // intentionally empty
      })
      const {TestingProvider, resolvedPanes, mockChild} = createTestingProvider({
        initialRouterState: {
          panes: [[{id: 'level1'}], [{id: 'level2'}], [{id: 'noChild'}]],
        },
      })

      const dynamicChild = (id: string) =>
        id === 'noChild'
          ? undefined
          : {
              id,
              child: dynamicChild,
            }

      mockChild.mockImplementation(dynamicChild)

      await act(async () => {
        render(<TestingProvider />)

        const {changes} = await resolvedPanes({collectChangesOverTime: true})
        expect(changes).toMatchObject([
          [{id: 'root'}, LOADING_PANE, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, {id: 'level2'}, LOADING_PANE],
          // note: the last loading pane is dropped, this is also when the
          // `console.warn` should go out
          [{id: 'root'}, {id: 'level1'}, {id: 'level2'}],
        ])
      })

      expect(consoleSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy.mock.calls[0]).toMatchObject([
        'Pane resolution error at index 3: Pane returned no child - see https://docs.sanity.io/help/structure-item-returned-no-child',
        {message: 'Pane returned no child'},
      ])
      consoleSpy.mockRestore()
    })

    it('replaces panes when the router state changes', async () => {
      const {TestingProvider, navigate, resolvedPanes} = createTestingProvider({
        initialRouterState: {
          panes: [[{id: 'level1'}], [{id: 'level2'}, {id: 'level3'}]],
        },
      })

      await act(async () => {
        render(<TestingProvider />)

        const initial = await resolvedPanes()
        expect(initial).toMatchObject([
          {id: 'root'},
          {id: 'level1'},
          {id: 'level2'},
          {id: 'level3'},
        ])

        await navigate(
          {panes: [[{id: 'level1'}], [{id: 'level2Alt'}], [{id: 'level3Alt'}]]},
          {replace: true}
        )

        const {changes} = await resolvedPanes({collectChangesOverTime: true})
        expect(changes).toMatchObject([
          // note: it preserves the current levels that didn't change
          [{id: 'root'}, {id: 'level1'}, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, {id: 'level2Alt'}, LOADING_PANE],
          [{id: 'root'}, {id: 'level1'}, {id: 'level2Alt'}, {id: 'level3Alt'}],
        ])
      })
    })

    it('removes panes when the router state changes', async () => {
      const {TestingProvider, navigate, resolvedPanes} = createTestingProvider({
        initialRouterState: {
          panes: [[{id: 'level1'}], [{id: 'level2'}, {id: 'level3'}]],
        },
      })

      await act(async () => {
        render(<TestingProvider />)

        const initial = await resolvedPanes()
        expect(initial).toMatchObject([
          {id: 'root'},
          {id: 'level1'},
          {id: 'level2'},
          {id: 'level3'},
        ])

        await navigate(
          // removing levels
          {panes: [[{id: 'level1'}]]},
          {replace: true}
        )

        const {changes} = await resolvedPanes({collectChangesOverTime: true})
        // removals should reflect in one update
        expect(changes).toHaveLength(1)
        expect(changes).toMatchObject([[{id: 'root'}, {id: 'level1'}]])
      })
    })

    it('works with the fallback editor', async () => {
      const {TestingProvider, resolvedPanes} = createTestingProvider({
        initialRouterState: {
          panes: [
            [
              {
                id: '__edit__myDocument',
                params: {template: 'myTemplate', type: 'myType'},
                payload: {myPayload: true},
              },
            ],
          ],
        },
      })

      await act(async () => {
        render(<TestingProvider />)

        const result = await resolvedPanes()
        expect(result).toHaveLength(2)
        const [root, editor] = result

        expect(root).toMatchObject({id: 'root'})
        expect(editor).toMatchObject({
          id: 'editor',
          options: {
            id: 'myDocument',
            template: 'myTemplate',
            templateParameters: {myPayload: true},
            type: 'myType',
          },
          type: 'document',
        })
      })
    })

    it('passes the correct arguments to the structure child/items', async () => {
      const {TestingProvider, resolvedPanes, mockChild} = createTestingProvider({
        initialRouterState: {
          panes: [
            [{id: 'level1'}, {id: 'level1SplitView'}],
            [
              {id: 'level2'},
              {
                id: '__edit__level2FallbackEditor',
                params: {template: 'myTemplate', type: 'myType'},
                payload: {foo: 'bar'},
              },
            ],
          ],
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dynamicChild: any = jest.fn((...args: unknown[]) => ({
        id: args[0],
        child: dynamicChild,
        args,
      }))
      mockChild.mockImplementation(dynamicChild)

      await act(async () => {
        render(<TestingProvider />)

        await expect(resolvedPanes()).resolves.toMatchObject([
          {id: 'root'},
          {
            id: 'level1',
            args: [
              'level1',
              {
                parent: {id: 'root'},
                path: ['root', 'level1'],
                index: 1,
                splitIndex: 0,
              },
            ],
          },
          {
            id: 'level1SplitView',
            args: [
              'level1SplitView',
              {
                parent: {id: 'root'},
                path: ['root', 'level1SplitView'],
                index: 2,
                splitIndex: 1,
              },
            ],
          },
          {
            id: 'level2',
            args: [
              'level2',
              {
                id: 'level2',
                index: 3,
                params: {},
                parent: {id: 'level1SplitView'},
                path: ['root', 'level1SplitView', 'level2'],
                payload: undefined,
                splitIndex: 0,
              },
            ],
          },
          {
            id: 'editor',
            type: 'document',
            options: {
              id: 'level2FallbackEditor',
              template: 'myTemplate',
              type: 'myType',
              templateParameters: {foo: 'bar'},
            },
          },
        ])

        // note: the fallback editor doesn't call the dynamicChild
        expect(dynamicChild).toHaveBeenCalledTimes(3)
      })
    })

    it('takes in observables for each structure children that emit over time', async () => {
      const {TestingProvider, resolvedPanes, mockChild} = createTestingProvider({
        initialRouterState: {
          panes: [[{id: 'observableChild'}], [{id: 'next'}], [{id: 'leaf'}]],
        },
      })

      const dynamicChild = (id: string) => {
        if (id === 'observableChild') {
          return Rx.of(1, 2, 3).pipe(
            operators.map((i) => ({
              id: `observableChild${i}`,
              child: (nestedId: string) => ({
                id: `${nestedId}FromObservable${i}`,
                child: dynamicChild,
              }),
            }))
          )
        }

        return {id, child: dynamicChild}
      }

      mockChild.mockImplementation(dynamicChild)

      await act(async () => {
        render(<TestingProvider />)

        const {changes} = await resolvedPanes({collectChangesOverTime: true})

        expect(changes).toMatchObject([
          [{id: 'root'}, LOADING_PANE, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'observableChild1'}, LOADING_PANE, LOADING_PANE],
          [{id: 'root'}, {id: 'observableChild1'}, {id: 'nextFromObservable1'}, LOADING_PANE],
          [{id: 'root'}, {id: 'observableChild1'}, {id: 'nextFromObservable1'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild2'}, {id: 'nextFromObservable1'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild2'}, {id: 'nextFromObservable2'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild2'}, {id: 'nextFromObservable2'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild3'}, {id: 'nextFromObservable2'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild3'}, {id: 'nextFromObservable3'}, {id: 'leaf'}],
          [{id: 'root'}, {id: 'observableChild3'}, {id: 'nextFromObservable3'}, {id: 'leaf'}],
        ])
      })
    })
  })
})
