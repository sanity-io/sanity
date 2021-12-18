import {createStructureBuilder} from '../src'
import {ChildResolver} from '../src/ChildResolver'
import {DocumentTypeListBuilder} from '../src/DocumentTypeList'
import {serializeStructure} from './util/serializeStructure'
import {schema} from './mocks/schema'

// @todo: Mock the Sanity client here?
const client = {} as any

const nope = () => 'NOPE'
const editor = {
  id: 'documentEditor',
  options: {
    type: 'author',
    id: 'grrm',
  },
}

test('generates correct document type list items from global schema', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.documentTypeListItems()).toMatchSnapshot()
})

test('generates correct document type list items from given schema', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.documentTypeListItems()).toMatchSnapshot()
})

test('generates correct document type list item for specific type', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  expect(S.documentTypeListItem('author')).toMatchSnapshot()
  expect(S.documentTypeListItem('author')).toMatchSnapshot()
})

test('generated canHandleIntent responds to edit/create on document type', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const listItems = S.documentTypeListItems().map((item) => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const childResolver = listItems[0].child as ChildResolver
  const resolverContext = {client, schema, structureBuilder: S, templates: []} as any
  const childBuilder = childResolver(resolverContext, 'author', {
    index: 0,
    parent: S.list().id('foo').items(listItems).serialize(),
  } as any) as DocumentTypeListBuilder

  const child = childBuilder.serialize()
  expect(child).toHaveProperty('canHandleIntent')

  const ctx = {pane: child, index: 0}
  expect((child.canHandleIntent || nope)('create', {type: 'book'}, ctx)).toBe(false)
  expect((child.canHandleIntent || nope)('create', {type: 'author'}, ctx)).toBe(true)
  expect((child.canHandleIntent || nope)('edit', {id: 'wow'}, ctx)).toBe(false)
})

test('generated document panes responds with correct editor child', (done) => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const listItems = S.documentTypeListItems().map((item) => item.serialize())
  expect(listItems).toHaveLength(2)
  expect(listItems[0]).toMatchObject({id: 'author', title: 'Author'})
  expect(listItems[0]).toHaveProperty('child')

  const childResolver = listItems[0].child as ChildResolver
  const resolverContext = {client, schema, structureBuilder: S, templates: []} as any
  const childBuilder = childResolver(resolverContext, 'author', {
    index: 0,
    parent: S.list().id('foo').items(listItems).serialize(),
  } as any) as DocumentTypeListBuilder

  const authorsList = childBuilder.serialize()
  expect(authorsList).toHaveProperty('canHandleIntent')

  const context = {parent: listItems[0], index: 0}
  serializeStructure(authorsList.child, context, [resolverContext, 'grrm', context]).subscribe(
    (itemChild) => {
      expect(itemChild).toMatchObject(editor)

      done()
    }
  )
})

test('manually assigned canHandleIntent should not be overriden', () => {
  const S = createStructureBuilder({client, initialValueTemplates: [], schema})

  const alwaysFalse = () => false
  const list = S.documentTypeList('author')
  const modified = list.canHandleIntent(alwaysFalse)
  const ctx = {pane: list.serialize(), index: 0}

  // Test default handler
  const defHandler = list.getCanHandleIntent() || nope
  expect(defHandler('create', {type: 'author'}, ctx)).toBe(true)

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
