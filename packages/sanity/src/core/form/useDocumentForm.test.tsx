import {type SanityClient} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
import {useValidationStatus} from '../hooks/useValidationStatus'
import {administrator} from '../store/grants/debug/exampleGrants'
import {useDocumentForm} from './useDocumentForm'

const schemaTypes = [
  defineType({
    name: 'article',
    type: 'document',
    fields: [
      defineField({
        name: 'body',
        type: 'array',
        of: [defineArrayMember({type: 'block'}), defineArrayMember({type: 'image', name: 'image'})],
      }),
    ],
  }),
]

const BLOCK_PATH: Path = ['body', {_key: 'block-a'}]
const OTHER_BLOCK_PATH: Path = ['body', {_key: 'block-b'}]

async function createDocumentFormProvider() {
  const mockClient = createMockSanityClient({
    requests: {
      // The permission checks behind the form's `readOnly` state read the dataset ACL.
      '/acl': administrator,
    },
  })
  const wrapper = await createTestProvider({
    client: mockClient as unknown as SanityClient,
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
    }),
  })
  return {mockClient, wrapper}
}

async function renderDocumentForm() {
  const {wrapper} = await createDocumentFormProvider()

  const {result} = renderHook(
    () => useDocumentForm({documentId: 'article-1', documentType: 'article'}),
    {wrapper},
  )

  // `onPathOpen` is a no-op until the form state exists, since it needs it to expand
  // collapsed ancestors of the path being opened.
  await waitFor(() => expect(result.current.formState).not.toBeNull())

  return result
}

describe('useDocumentForm', () => {
  let result: Awaited<ReturnType<typeof renderDocumentForm>>

  beforeEach(async () => {
    result = await renderDocumentForm()
  })

  it('follows the focused field into the object that contains it', async () => {
    act(() => result.current.onFocus([...BLOCK_PATH, 'alt']))
    await waitFor(() => expect(result.current.openPath).toEqual(BLOCK_PATH))
  })

  it('keeps an open array item open when focus lands on the item itself', async () => {
    act(() => result.current.onPathOpen(BLOCK_PATH))
    await waitFor(() => expect(result.current.openPath).toEqual(BLOCK_PATH))

    // The Portable Text editor reports the block object's own path as the focus path
    // whenever its selection is (re-)announced — while an upload is in flight, for
    // instance. Stepping one segment up from there used to close the dialog editing the
    // block, which unmounted the image input and aborted the upload.
    act(() => result.current.onFocus(BLOCK_PATH))
    await waitFor(() => expect(result.current.openPath).toEqual(BLOCK_PATH))
  })

  it('closes an open array item when focus moves to a sibling item', async () => {
    act(() => result.current.onPathOpen(BLOCK_PATH))
    await waitFor(() => expect(result.current.openPath).toEqual(BLOCK_PATH))

    act(() => result.current.onFocus(OTHER_BLOCK_PATH))
    await waitFor(() => expect(result.current.openPath).toEqual(['body']))
  })

  it('closes an open array item when focus moves to an unrelated field', async () => {
    act(() => result.current.onPathOpen(BLOCK_PATH))
    await waitFor(() => expect(result.current.openPath).toEqual(BLOCK_PATH))

    act(() => result.current.onFocus(['title']))
    await waitFor(() => expect(result.current.openPath).toEqual([]))
  })

  it('records collapsed paths and fieldsets from the form handlers', () => {
    act(() => {
      result.current.onSetCollapsedPath(['body'], true)
      result.current.onSetCollapsedFieldSet(['meta'], false)
    })

    expect(result.current.collapsedPaths).toEqual({
      value: undefined,
      children: {body: {value: true}},
    })
    expect(result.current.collapsedFieldSets).toEqual({
      value: undefined,
      children: {meta: {value: false}},
    })
  })

  it('clears the focus path when the form blurs', async () => {
    act(() => result.current.onFocus(['title']))
    await waitFor(() => expect(result.current.focusPath).toEqual(['title']))

    act(() => result.current.onBlur(['title']))
    await waitFor(() => expect(result.current.focusPath).toEqual([]))
  })
})

describe('useDocumentForm validation', () => {
  it('validates the document through the pair the form checks out, not the global listener', async () => {
    const {mockClient, wrapper} = await createDocumentFormProvider()
    // the ids the document preview store's global listener has fetched documents for
    const fetchedGlobally = () =>
      mockClient.$log.observable.fetch
        .filter(({query}) => query === '*[_id in $ids]')
        .flatMap(({params}) => params.ids)

    const {result} = renderHook(
      () => useDocumentForm({documentId: 'article-1', documentType: 'article'}),
      {wrapper},
    )
    await waitFor(() => expect(result.current.formState).not.toBeNull())
    // A document no form has open validates through the global listener. Validated after the
    // form's, its fetch goes out after any the form's validation would have made.
    renderHook(() => useValidationStatus('drafts.article-2', 'article'), {wrapper})
    await waitFor(() => expect(fetchedGlobally()).toContain('drafts.article-2'))

    expect(fetchedGlobally()).not.toContain('article-1')
    expect(fetchedGlobally()).not.toContain('drafts.article-1')
  })
})
