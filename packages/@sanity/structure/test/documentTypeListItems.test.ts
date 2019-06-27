import {StructureBuilder as S} from '../src'
import {defaultSchema} from '../src/parts/Schema'
import {DocumentList} from '../src/DocumentList'
import serializeStructure from './util/serializeStructure'

const nope = () => 'NOPE'
const editor = {
  id: 'editor',
  options: {
    type: 'author',
    id: 'grrm'
  }
}

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
  const listItems = S.documentTypeListItems().map(item => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')
  expect(listItems[0].child).toHaveProperty('canHandleIntent')

  const child = listItems[0].child as DocumentList
  expect((child.canHandleIntent || nope)('create', {type: 'book'})).toBe(false)
  expect((child.canHandleIntent || nope)('create', {type: 'author'})).toBe(true)
  expect((child.canHandleIntent || nope)('edit', {id: 'wow'})).toBe(false)
})

test('generated document panes responds with correct editor child', done => {
  const listItems = S.documentTypeListItems().map(item => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const listItem = listItems[0].child as DocumentList
  const context = {parent: listItem, index: 0}
  serializeStructure(listItem.child, context, ['grrm', context]).subscribe(itemChild => {
    expect(itemChild).toMatchObject(editor)

    done()
  })
})

test('manually assigned canHandleIntent should not be overriden', () => {
  const alwaysFalse = () => false
  const list = S.documentTypeList('author')
  const modified = list.canHandleIntent(alwaysFalse)

  // Test default handler
  const defHandler = list.getCanHandleIntent() || nope
  expect(defHandler('create', {type: 'author'})).toBe(true)

  // Test modified handler
  const modHandler = modified.getCanHandleIntent() || nope
  expect(modHandler('create', {type: 'author'})).toBe(false)

  // Modifying child for default list _SHOULD_ reset canHandleIntent
  const diffChild = list.child(() => editor)
  const diffHandler = diffChild.getCanHandleIntent()
  expect(diffHandler).toBeUndefined()

  // Modifying child for list with custom intent handler should _NOT_ reset canHandleIntent
  const customChild = modified.child(() => editor)
  const customHandler = customChild.getCanHandleIntent()
  expect(customHandler).toEqual(alwaysFalse)
})
