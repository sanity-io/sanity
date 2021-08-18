import {of as observableOf} from 'rxjs'
import {takeWhile, concatMap, reduce} from 'rxjs/operators'
import {resolvePanes} from '../src/utils/resolvePanes'
import {LOADING_PANE} from '../src/constants'
import singleStatsStructure from './fixtures/structures/singleStatsStructure'
import singletonStructure from './fixtures/structures/singletonStructure'
import recursiveStructure from './fixtures/structures/recursiveStructure'
import asyncSingletonStructure from './fixtures/structures/asyncSingletonStructure'
import typeDocumentStructure from './fixtures/structures/typeDocumentStructure'
import fullyAsyncStructure from './fixtures/structures/fullyAsyncStructure'
import failStructure from './fixtures/structures/failStructure'

const isLoading = (panes) => panes.some((pane) => pane === LOADING_PANE)

const collectUntilDone = (source) =>
  source
    .pipe(
      concatMap((panes) => (isLoading(panes) ? observableOf(panes) : observableOf(panes, false))),
      takeWhile((panes) => Boolean(panes)),
      reduce((acc, update) => acc.concat([update]), [])
    )
    .toPromise()

const collectLast = (source) =>
  new Promise((resolve, reject) => {
    let last = null
    const sub = source.subscribe((val) => {
      last = val
    }, reject)

    const done = () => sub.unsubscribe() || last

    setTimeout(() => resolve(done()), 100)
  })

describe.skip('resolvePanes', () => {
  test('can resolve one-pane structure', () =>
    expect(collectLast(resolvePanes(singleStatsStructure, []))).resolves.toMatchObject([
      singleStatsStructure,
    ]))

  test('can resolve singleton structure', () =>
    expect(collectLast(resolvePanes(singletonStructure, ['b']))).resolves.toMatchObject([
      singletonStructure,
      singletonStructure.options.items[1].child,
    ]))

  test('can resolve singleton structure asyncronously', () =>
    expect(collectUntilDone(resolvePanes(asyncSingletonStructure, ['b']))).resolves.toMatchObject([
      [LOADING_PANE, LOADING_PANE],
      [asyncSingletonStructure, LOADING_PANE],
      [
        asyncSingletonStructure,
        {
          type: 'document',
          options: {id: 'b', type: 'someType'},
        },
      ],
    ]))

  test('can resolve asyncronous structures using mix of promises & observables', () =>
    expect(
      collectUntilDone(resolvePanes(fullyAsyncStructure(), ['book', 'got']))
    ).resolves.toMatchSnapshot())

  test('emits error on observable failure', () =>
    expect(
      collectUntilDone(resolvePanes(fullyAsyncStructure({errorAt: 2}), ['book', 'got']))
    ).rejects.toMatchSnapshot())

  test('emits error on promise failure', () =>
    expect(
      collectUntilDone(resolvePanes(fullyAsyncStructure({errorAt: 1}), ['book', 'got']))
    ).rejects.toMatchSnapshot())

  test('emits error on root-level failure', () =>
    expect(collectUntilDone(resolvePanes(failStructure(), []))).rejects.toMatchSnapshot())

  describe('can resolve plain old content structure', () => {
    test('root', () =>
      expect(collectLast(resolvePanes(typeDocumentStructure, []))).resolves.toMatchObject([
        typeDocumentStructure,
      ]))

    test('root => type', () =>
      expect(collectLast(resolvePanes(typeDocumentStructure, ['book']))).resolves.toMatchObject([
        typeDocumentStructure,
        typeDocumentStructure.options.items[0].child,
      ]))

    test('root => type => document', () =>
      expect(
        collectLast(resolvePanes(typeDocumentStructure, ['book', 'got']))
      ).resolves.toMatchObject([
        typeDocumentStructure,
        typeDocumentStructure.options.items[0].child,
        {
          type: 'document',
          options: {id: 'got', type: 'book'},
        },
      ]))
  })

  describe('halts at first item which does not resolve to child', () => {
    test('at index 0', () =>
      expect(collectLast(resolvePanes(typeDocumentStructure, ['zing']))).resolves.toMatchObject([
        typeDocumentStructure,
      ]))

    test('at index 1', () =>
      expect(
        collectLast(resolvePanes(typeDocumentStructure, ['book', '404']))
      ).resolves.toMatchObject([
        typeDocumentStructure,
        typeDocumentStructure.options.items[0].child,
      ]))

    test('at index 1, with more items to go', () =>
      expect(
        collectLast(resolvePanes(typeDocumentStructure, ['book', '404', '404']))
      ).resolves.toMatchObject([
        typeDocumentStructure,
        typeDocumentStructure.options.items[0].child,
      ]))
  })

  test('can resolve recursive structure', () =>
    expect(
      collectLast(resolvePanes(recursiveStructure, ['List', 'List', 'List', 'Singleton']))
    ).resolves.toMatchObject([
      recursiveStructure,
      recursiveStructure,
      recursiveStructure,
      {type: 'document', options: {id: 'Singleton', type: 'whatever'}},
    ]))
})
