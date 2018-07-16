import {StructureBuilder as S} from '../src'
import {defaultSchema} from '../src/parts/schema'
import {DocumentList} from '../src/DocumentList'

test('generates correct document type list items from global schema', () => {
  expect(S.documentTypeListItems()).toMatchSnapshot()
})

test('generates correct document type list items from given schema', () => {
  expect(S.documentTypeListItems(defaultSchema)).toMatchSnapshot()
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
