import {type SanityClient} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
import type * as UseTargetDocumentStateMod from '../hooks/useTargetDocumentState'
import {PerspectiveProvider} from '../perspective/PerspectiveProvider'
import {administrator} from '../store/grants/debug/exampleGrants'
import {useDocumentForm} from './useDocumentForm'

// The selected variant's target never resolves in this suite, which is the state that locks the
// form when a variant is selected in the form's perspective scope.
vi.mock('../hooks/useTargetDocumentState', async (importOriginal) => {
  const original = await importOriginal<typeof UseTargetDocumentStateMod>()
  return {
    ...original,
    useTargetDocumentState: vi.fn(() => ({status: 'resolving'}) as const),
  }
})

const schemaTypes = [
  defineType({
    name: 'article',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

/**
 * Renders `useDocumentForm` under a perspective with a selected variant. When `scoped` is set, an
 * additional variant-free `PerspectiveProvider` is nested around the hook — the pattern consumers
 * like the diff view panes use to render a specific document version regardless of the globally
 * selected perspective.
 */
async function renderDocumentForm({scoped}: {scoped: boolean}) {
  const client = createMockSanityClient({
    requests: {
      // The permission checks behind the form's `readOnly` state read the dataset ACL.
      '/acl': administrator,
    },
  }) as unknown as SanityClient
  const TestProvider = await createTestProvider({
    client,
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
    }),
  })

  function Wrapper({children}: PropsWithChildren) {
    return (
      <TestProvider>
        <PerspectiveProvider selectedPerspectiveName={undefined} selectedVariantName="audience-a">
          {scoped ? (
            <PerspectiveProvider selectedPerspectiveName={undefined}>
              {children}
            </PerspectiveProvider>
          ) : (
            children
          )}
        </PerspectiveProvider>
      </TestProvider>
    )
  }

  const {result} = renderHook(
    () => useDocumentForm({documentId: 'article-1', documentType: 'article'}),
    {wrapper: Wrapper},
  )

  await waitFor(() => expect(result.current.formState).not.toBeNull())

  return result
}

describe('useDocumentForm scoped perspective', () => {
  it('locks the form while the selected variant target is unresolved', async () => {
    const result = await renderDocumentForm({scoped: false})

    // A variant is selected in the form's perspective scope but its target has not resolved, so
    // editing is blocked to prevent patches from falling back to the base draft/published pair.
    await waitFor(() => expect(result.current.formState?.readOnly).toBe(true))
  })

  it('derives from the nearest perspective scope, ignoring the outer selected variant', async () => {
    const result = await renderDocumentForm({scoped: true})

    // The nested variant-free provider is the nearest perspective scope: no variant participates,
    // so the unresolved variant target of the outer scope is irrelevant and the form derives its
    // target from the provided ids and stays editable.
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.formState?.readOnly).not.toBe(true)
    expect(result.current.value._id).toBe('article-1')
  })
})
