import {StructureBuilder as S} from '../src'
import {defaultSchema} from '../src/parts/Schema'
import {DocumentList} from '../src/DocumentList'
import serializeStructure from './util/serializeStructure'

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
  expect(child.canHandleIntent('create', {type: 'book'})).toBe(false)
  expect(child.canHandleIntent('create', {type: 'author'})).toBe(true)
  expect(child.canHandleIntent('edit', {id: 'wow'})).toBe(true)
})

test('generated document panes responds with correct editor child', done => {
  const listItems = S.documentTypeListItems().map(item => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const listItem = listItems[0].child as DocumentList
  const context = {parent: listItem, index: 0}
  serializeStructure(listItem.child, context, ['grrm', context]).subscribe(itemChild => {
    expect(itemChild).toMatchObject({
      id: 'editor',
      options: {
        type: 'author',
        id: 'grrm'
      }
    })

    done()
  })
})
