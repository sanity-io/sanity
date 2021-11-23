import {StructureBuilder as S} from '../src'
import {getDefaultSchema} from '../src/parts/Schema'
import {ChildResolver} from '../src/ChildResolver'
import {DocumentTypeListBuilder} from '../src/DocumentTypeList'
import serializeStructure from './util/serializeStructure'

const nope = () => 'NOPE'
const editor = {
  id: 'documentEditor',
  options: {
    type: 'author',
    id: 'grrm',
  },
}
const defaultSchema = getDefaultSchema()

test('generates correct document type list items from global schema', () => {
  expect(S.documentTypeListItems()).toMatchSnapshot()
})

test('generates correct document type list items from given schema', () => {
  expect(S.documentTypeListItems(defaultSchema)).toMatchSnapshot()
})

test('generates correct document type list item for specific type', () => {
  expect(S.documentTypeListItem('author')).toMatchSnapshot()
  expect(S.documentTypeListItem('author', defaultSchema)).toMatchSnapshot()
})

test('generated canHandleIntent responds to edit/create on document type', () => {
  const listItems = S.documentTypeListItems().map((item) => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const childResolver = listItems[0].child as ChildResolver
  const childBuilder = childResolver('author', {
    index: 0,
    parent: S.list().id('foo').items(listItems).serialize(),
  }) as DocumentTypeListBuilder

  const child = childBuilder.serialize()
  expect(child).toHaveProperty('canHandleIntent')

  const ctx = {pane: child, index: 0}
  expect((child.canHandleIntent || nope)('create', {type: 'book'}, ctx)).toBe(false)
  expect((child.canHandleIntent || nope)('create', {type: 'author'}, ctx)).toBe(true)
  expect((child.canHandleIntent || nope)('edit', {id: 'wow'}, ctx)).toBe(false)
})

test('generated document panes responds with correct editor child', (done) => {
  const listItems = S.documentTypeListItems().map((item) => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const childResolver = listItems[0].child as ChildResolver
  const childBuilder = childResolver('author', {
    index: 0,
    parent: S.list().id('foo').items(listItems).serialize(),
  }) as DocumentTypeListBuilder

  const authorsList = childBuilder.serialize()
  expect(authorsList).toHaveProperty('canHandleIntent')

  const context = {parent: listItems[0], index: 0}
  serializeStructure(authorsList.child, context, ['grrm', context]).subscribe((itemChild) => {
    expect(itemChild).toMatchObject(editor)

    done()
  })
})

test('manually assigned canHandleIntent should not be overriden', () => {
  const alwaysFalse = () => false
  const list = S.documentTypeList('author')
  const modified = list.canHandleIntent(alwaysFalse)
  const ctx = {pane: list.serialize(), index: 0}

  // Test that there is nothing set by default
  expect(list.getCanHandleIntent()).toBe(undefined)

  // Test modified handler
  const modHandler = modified.getCanHandleIntent() || nope
  expect(modHandler('create', {type: 'author'}, ctx)).toBe(false)

  // Modifying child for default list _SHOULD_ reset canHandleIntent
  const diffChild = list.child(() => editor)
  const diffHandler = diffChild.getCanHandleIntent()
  expect(diffHandler).toBeUndefined()

  // Modifying child for list with custom intent handler should _NOT_ reset canHandleIntent
  const customChild = modified.child(() => editor)
  const customHandler = customChild.getCanHandleIntent()
  expect(customHandler).toEqual(alwaysFalse)
})
