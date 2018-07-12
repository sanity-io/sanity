import resolvePanes from '../src/utils/resolvePanes'
import singletonStructure from './fixtures/structures/singletonStructure'
import recursiveStructure from './fixtures/structures/recursiveStructure'
import singleStatsStructure from './fixtures/structures/singleStatsStructure'
import asyncSingletonStructure from './fixtures/structures/asyncSingletonStructure'
import typeDocumentStructure from './fixtures/structures/typeDocumentStructure'

test('can resolve one-pane structure', () =>
  expect(resolvePanes(singleStatsStructure, [])).resolves.toMatchObject([singleStatsStructure]))

test('can resolve singleton structure', () =>
  expect(resolvePanes(singletonStructure, ['b'])).resolves.toMatchObject([
    singletonStructure,
    singletonStructure.options.items[1].child
  ]))

test('can resolve singleton structure asyncronously', () =>
  expect(resolvePanes(asyncSingletonStructure, ['b'])).resolves.toMatchObject([
    asyncSingletonStructure,
    {
      type: 'document',
      options: {id: 'b', type: 'someType'}
    }
  ]))

describe('can resolve plain old content structure', () => {
  test('root', () =>
    expect(resolvePanes(typeDocumentStructure, [])).resolves.toMatchObject([typeDocumentStructure]))

  test('root => type', () =>
    expect(resolvePanes(typeDocumentStructure, ['book'])).resolves.toMatchObject([
      typeDocumentStructure,
      typeDocumentStructure.options.items[0].child
    ]))

  test('root => type => document', () =>
    expect(resolvePanes(typeDocumentStructure, ['book', 'got'])).resolves.toMatchObject([
      typeDocumentStructure,
      typeDocumentStructure.options.items[0].child,
      {
        type: 'document',
        options: {id: 'got', type: 'book'}
      }
    ]))
})

describe('halts at first item which does not resolve to child', () => {
  test('at index 0', () =>
    expect(resolvePanes(typeDocumentStructure, ['zing'])).resolves.toMatchObject([
      typeDocumentStructure
    ]))

  test('at index 1', () =>
    expect(resolvePanes(typeDocumentStructure, ['book', '404'])).resolves.toMatchObject([
      typeDocumentStructure,
      typeDocumentStructure.options.items[0].child
    ]))

  test('at index 1, with more items to go', () =>
    expect(resolvePanes(typeDocumentStructure, ['book', '404', '404'])).resolves.toMatchObject([
      typeDocumentStructure,
      typeDocumentStructure.options.items[0].child
    ]))
})

test('can resolve recursive structure', () =>
  expect(
    resolvePanes(recursiveStructure, ['List', 'List', 'List', 'Singleton'])
  ).resolves.toMatchObject([
    recursiveStructure,
    recursiveStructure,
    recursiveStructure,
    {type: 'document', options: {id: 'Singleton', type: 'whatever'}}
  ]))
