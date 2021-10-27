import * as Rx from 'rxjs'
import * as operators from 'rxjs/operators'
import type {PaneNode, PaneNodeResolver, RouterPanes} from '../types'
import {createResolvedPaneNodeStream} from './createResolvedPaneNodeStream'

function collectEmissionsOverTime<T>(observable: Rx.Observable<T>) {
  const stream = observable.pipe(operators.publish()) as Rx.ConnectableObservable<T>

  setTimeout(() => {
    stream.connect()
  })

  const emissions = stream
    .pipe(operators.buffer(stream.pipe(operators.debounceTime(500))))
    .toPromise()

  return emissions
}

jest.mock('part:@sanity/base/schema', () => {
  const createSchema = jest.requireActual('part:@sanity/base/schema-creator')

  return createSchema({
    name: 'mockSchema',
    types: [
      {
        name: 'book',
        title: 'Book',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })
})

describe('createResolvedPaneNodeStream', () => {
  it('creates a stream of resolved panes from a stream of router panes and a root pane', async () => {
    const routerPanes: RouterPanes = [[{id: 'a'}], [{id: 'b'}]]

    const dynamicPaneNode: PaneNodeResolver = (id) => ({
      type: 'component',
      id,
      title: id,
      component: () => null,
      child: dynamicPaneNode,
    })

    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode: dynamicPaneNode,
      routerPanesStream: Rx.of(routerPanes),
    })

    await expect(collectEmissionsOverTime(resolvedPanes$)).resolves.toMatchObject([
      [
        {
          flatIndex: 0,
          groupIndex: 0,
          paneNode: {id: 'root', title: 'root', type: 'component'},
          path: ['root'],
          routerPaneSibling: {id: 'root'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 1,
          groupIndex: 1,
          paneNode: null,
          path: ['root', '[1]', '[2]'],
          routerPaneSibling: {id: 'a'},
          siblingIndex: 0,
          type: 'loading',
        },
        {
          flatIndex: 2,
          groupIndex: 2,
          paneNode: null,
          path: ['root', '[2]'],
          routerPaneSibling: {id: 'b'},
          siblingIndex: 0,
          type: 'loading',
        },
      ],
      [
        {
          flatIndex: 0,
          groupIndex: 0,
          paneNode: {id: 'root', title: 'root', type: 'component'},
          path: ['root'],
          routerPaneSibling: {id: 'root'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 1,
          groupIndex: 1,
          paneNode: {id: 'a', title: 'a', type: 'component'},
          path: ['root', 'a'],
          routerPaneSibling: {id: 'a'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 2,
          groupIndex: 2,
          paneNode: null,
          path: ['root', '[2]'],
          routerPaneSibling: {id: 'b'},
          siblingIndex: 0,
          type: 'loading',
        },
      ],
      [
        {
          flatIndex: 0,
          groupIndex: 0,
          paneNode: {id: 'root', title: 'root', type: 'component'},
          path: ['root'],
          routerPaneSibling: {id: 'root'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 1,
          groupIndex: 1,
          paneNode: {id: 'a', title: 'a', type: 'component'},
          path: ['root', 'a'],
          routerPaneSibling: {id: 'a'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 2,
          groupIndex: 2,
          paneNode: {id: 'b', title: 'b', type: 'component'},
          path: ['root', 'a', 'b'],
          routerPaneSibling: {id: 'b'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
      ],
    ])
  })

  it('resolves the fallback editor', async () => {
    const routerPanes: RouterPanes = [
      [
        {
          id: '__edit__myDocument',
          params: {template: 'myTemplate', type: 'myType'},
          payload: {myPayload: true},
        },
      ],
    ]

    const dynamicPaneNode: PaneNodeResolver = (id) => ({
      type: 'component',
      id,
      title: id,
      component: () => null,
      child: dynamicPaneNode,
    })

    const resolvedPanes = createResolvedPaneNodeStream({
      rootPaneNode: dynamicPaneNode,
      routerPanesStream: Rx.of(routerPanes),
    })
      .pipe(operators.debounceTime(500), operators.first())
      .toPromise()

    await expect(resolvedPanes).resolves.toMatchObject([
      {
        flatIndex: 0,
        paneNode: {id: 'root'},
        type: 'resolvedMeta',
      },
      {
        flatIndex: 1,
        paneNode: {
          id: 'editor',
          options: {
            id: 'myDocument',
            template: 'myTemplate',
            templateParameters: {myPayload: true},
            type: 'myType',
          },
          title: 'Editor',
          type: 'document',
        },
        routerPaneSibling: {
          id: '__edit__myDocument',
          params: {template: 'myTemplate', type: 'myType'},
          payload: {myPayload: true},
        },
        siblingIndex: 0,
        type: 'resolvedMeta',
      },
    ])
  })

  it('resolves split panes from router pane state', async () => {
    const routerPanes: RouterPanes = [
      [{id: 'books'}],
      [{id: 'book-123'}, {id: 'book-123', params: {view: 'preview'}}],
      [{id: 'book-doc-child'}],
    ]

    const dynamicPaneNode: PaneNodeResolver = (id) => ({
      type: 'component',
      id,
      title: id,
      component: () => null,
      child: dynamicPaneNode,
    })

    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode: dynamicPaneNode,
      routerPanesStream: Rx.of(routerPanes),
    })

    const result = await resolvedPanes$
      .pipe(operators.debounceTime(500), operators.first())
      .toPromise()

    expect(result).toMatchObject([
      {
        flatIndex: 0,
        groupIndex: 0,
        paneNode: {id: 'root', title: 'root', type: 'component'},
        path: ['root'],
        routerPaneSibling: {id: 'root'},
        siblingIndex: 0,
        type: 'resolvedMeta',
      },
      {
        flatIndex: 1,
        groupIndex: 1,
        paneNode: {id: 'books', title: 'books', type: 'component'},
        path: ['root', 'books'],
        routerPaneSibling: {id: 'books'},
        siblingIndex: 0,
        type: 'resolvedMeta',
      },
      {
        flatIndex: 2,
        groupIndex: 2,
        paneNode: {id: 'book-123', title: 'book-123', type: 'component'},
        path: ['root', 'books', 'book-123'],
        routerPaneSibling: {id: 'book-123'},
        siblingIndex: 0,
        type: 'resolvedMeta',
      },
      {
        flatIndex: 3,
        groupIndex: 2,
        paneNode: {id: 'book-123', title: 'book-123', type: 'component'},
        path: ['root', 'books', 'book-123'],
        routerPaneSibling: {id: 'book-123', params: {view: 'preview'}},
        siblingIndex: 1,
        type: 'resolvedMeta',
      },
      {
        flatIndex: 4,
        groupIndex: 3,
        paneNode: {id: 'book-doc-child', title: 'book-doc-child', type: 'component'},
        path: ['root', 'books', 'book-123', 'book-doc-child'],
        routerPaneSibling: {id: 'book-doc-child'},
        siblingIndex: 0,
        type: 'resolvedMeta',
      },
    ])
  })

  it('preserves left-most pane instances on navigation', async () => {
    const routerPanes$ = Rx.from<RouterPanes[]>([
      [[{id: 'static'}], [{id: 'initial'}]],
      [[{id: 'static'}], [{id: 'changed'}]],
    ])

    const dynamicPaneNode: PaneNodeResolver = (id) => ({
      type: 'component',
      id,
      title: id,
      component: () => null,
      child: dynamicPaneNode,
    })

    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode: dynamicPaneNode,
      routerPanesStream: routerPanes$,
    })

    const emissions = await collectEmissionsOverTime(resolvedPanes$)
    expect(emissions).toMatchObject([
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: null, type: 'loading'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'static'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'static'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'initial'}, type: 'resolvedMeta'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'static'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'static'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'changed'}, type: 'resolvedMeta'},
      ],
    ])

    for (const emission of emissions.slice(1)) {
      // checks if the pane is `static` and is consistent through the rest of the emissions
      expect(emissions[1][1].paneNode?.id).toBe('static')
      expect(emissions[1][1].paneNode).toBe(emission[1].paneNode)
    }
  })

  it('catches pane resolution errors and logs the error in the console', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally empty
    })

    const rootPaneNode: PaneNode = {
      type: 'component',
      id: 'root',
      title: 'Root',
      component: () => null,
      // this will cause an error
      child: () => (undefined as unknown) as PaneNode,
    }

    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode,
      routerPanesStream: Rx.of([[{id: 'foo'}]]),
    })

    await expect(collectEmissionsOverTime(resolvedPanes$)).resolves.toMatchObject([
      [
        {
          flatIndex: 0,
          groupIndex: 0,
          paneNode: {id: 'root', title: 'Root', type: 'component'},
          path: ['root'],
          routerPaneSibling: {id: 'root'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        {
          flatIndex: 1,
          groupIndex: 1,
          paneNode: null,
          path: ['root', '[1]'],
          routerPaneSibling: {id: 'foo'},
          siblingIndex: 0,
          type: 'loading',
        },
      ],
      [
        {
          flatIndex: 0,
          groupIndex: 0,
          paneNode: {id: 'root', title: 'Root', type: 'component'},
          path: ['root'],
          routerPaneSibling: {id: 'root'},
          siblingIndex: 0,
          type: 'resolvedMeta',
        },
        // the loading pane disappears when this case happens
      ],
    ])

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy.mock.calls[0]).toMatchObject([
      'Pane resolution error at index 1: Pane returned no child - see https://docs.sanity.io/help/structure-item-returned-no-child',
      {message: 'Pane returned no child'},
    ])
    consoleSpy.mockRestore()
  })

  it('deletes items from the memo cache as router panes are removed', async () => {
    const dynamicPaneNode: PaneNodeResolver = (id) => ({
      type: 'component',
      id,
      title: id,
      component: () => null,
      child: dynamicPaneNode,
    })

    const routerPanes$ = Rx.from([
      //
      [[{id: 'foo'}], [{id: 'bar'}], [{id: 'baz'}]],
      //
      [[{id: 'foo'}]],
    ])

    const cache = new Map()
    const deleteSpy = jest.spyOn(cache, 'delete')
    const setSpy = jest.spyOn(cache, 'set')

    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode: dynamicPaneNode,
      routerPanesStream: routerPanes$,
      initialCacheState: {
        cacheKeysByFlatIndex: [],
        flattenedRouterPanes: [],
        resolvedPaneCache: cache,
        resolvePane: () => Rx.NEVER,
      },
    })

    await expect(collectEmissionsOverTime(resolvedPanes$)).resolves.toMatchObject([
      // loading panes
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: null, type: 'loading'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'foo'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'foo'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'bar'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
      ],
      // done loading
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'foo'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'bar'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: {id: 'baz'}, type: 'resolvedMeta'},
      ],
      // navigate to upper parent
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'foo'}, type: 'resolvedMeta'},
      ],
    ])

    expect(setSpy).toHaveBeenCalledTimes(8)
    // this will occur after the navigation
    expect(deleteSpy).toHaveBeenCalledTimes(2)
  })

  it('resolves promise-like, subscribable, serializable, and function pane nodes', async () => {
    const rootPaneNode: PaneNode = {
      type: 'component',
      id: 'root',
      component: () => null,
      title: 'Root',
      child: new Promise<PaneNode>((resolve) =>
        resolve({
          type: 'component',
          id: 'promise',
          component: () => null,
          title: 'Promise',
          child: () => ({
            type: 'component',
            component: () => null,
            title: 'Pane Resolver Function',
            id: 'paneResolver',
            child: Rx.from<PaneNode[]>([
              {
                type: 'component',
                id: 'observableChild1',
                title: 'Observable Child 1',
                component: () => null,
                child: {
                  serialize: () => ({
                    type: 'component',
                    id: 'serializable',
                    title: 'Serializable',
                    component: () => null,
                  }),
                },
              },
              {
                type: 'component',
                id: 'observableChild2',
                title: 'Observable Child 2',
                component: () => null,
                child: {
                  serialize: () => ({
                    type: 'component',
                    id: 'serializable',
                    title: 'Serializable',
                    component: () => null,
                  }),
                },
              },
            ]),
          }),
        })
      ),
    }

    const routerPanes: RouterPanes = [[{id: 'foo'}], [{id: 'bar'}], [{id: 'baz'}], [{id: 'beep'}]]
    const resolvedPanes$ = createResolvedPaneNodeStream({
      rootPaneNode,
      routerPanesStream: Rx.of(routerPanes),
    })

    await expect(collectEmissionsOverTime(resolvedPanes$)).resolves.toMatchObject([
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: null, type: 'loading'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
        {flatIndex: 4, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: null, type: 'loading'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
        {flatIndex: 4, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'paneResolver'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: null, type: 'loading'},
        {flatIndex: 4, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'paneResolver'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: {id: 'observableChild1'}, type: 'resolvedMeta'},
        {flatIndex: 4, paneNode: null, type: 'loading'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'paneResolver'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: {id: 'observableChild1'}, type: 'resolvedMeta'},
        {flatIndex: 4, paneNode: {id: 'serializable'}, type: 'resolvedMeta'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'paneResolver'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: {id: 'observableChild2'}, type: 'resolvedMeta'},
        {flatIndex: 4, paneNode: {id: 'serializable'}, type: 'resolvedMeta'},
      ],
      [
        {flatIndex: 0, paneNode: {id: 'root'}, type: 'resolvedMeta'},
        {flatIndex: 1, paneNode: {id: 'promise'}, type: 'resolvedMeta'},
        {flatIndex: 2, paneNode: {id: 'paneResolver'}, type: 'resolvedMeta'},
        {flatIndex: 3, paneNode: {id: 'observableChild2'}, type: 'resolvedMeta'},
        {flatIndex: 4, paneNode: {id: 'serializable'}, type: 'resolvedMeta'},
      ],
    ])
  })
})
