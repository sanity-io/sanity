import {type SanityClient} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
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

async function renderDocumentForm() {
  const client = createMockSanityClient({
    requests: {
      // The permission checks behind the form's `readOnly` state read the dataset ACL.
      '/acl': administrator,
    },
  }) as unknown as SanityClient
  const wrapper = await createTestProvider({
    client,
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
    }),
  })

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
})
