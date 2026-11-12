import {render, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {createSearch} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {AddIncomingReference} from './AddIncomingReference'

vi.mock('sanity', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  createSearch: vi.fn(() => () => of({hits: [], total: 0})),
  // Stub the autocomplete to avoid its FormBuilder context requirement; the search
  // factory is built in a useMemo before this renders, so the wiring is still exercised.
  ReferenceAutocomplete: () => null,
}))

// Avoid pulling in the create-action machinery; only the search wiring is under test.
vi.mock('./CreateNewIncomingReference', () => ({
  CreateNewIncomingReference: () => null,
}))

const mockCreateSearch = createSearch as unknown as Mock

const config = {
  schema: {
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  },
}

describe('AddIncomingReference', () => {
  beforeEach(() => mockCreateSearch.mockClear())

  it('passes the configured filter and params to createSearch', async () => {
    const wrapper = await createTestProvider({config})

    render(
      <AddIncomingReference
        type="book"
        referenced={{id: 'author1', type: 'author'}}
        onCreateNewReference={vi.fn()}
        onLinkDocument={vi.fn()}
        fieldName="books"
        creationAllowed
        filter="brand == $brand"
        filterParams={{brand: 'Penguin'}}
      />,
      {wrapper},
    )

    await waitFor(() => expect(mockCreateSearch).toHaveBeenCalled())
    const [, , options] = mockCreateSearch.mock.calls[0]
    expect(options).toMatchObject({filter: 'brand == $brand', params: {brand: 'Penguin'}})
  })

  it('passes an undefined filter when none is configured', async () => {
    const wrapper = await createTestProvider({config})

    render(
      <AddIncomingReference
        type="book"
        referenced={{id: 'author1', type: 'author'}}
        onCreateNewReference={vi.fn()}
        onLinkDocument={vi.fn()}
        fieldName="books"
        creationAllowed
      />,
      {wrapper},
    )

    await waitFor(() => expect(mockCreateSearch).toHaveBeenCalled())
    const [, , options] = mockCreateSearch.mock.calls[0]
    expect(options.filter).toBeUndefined()
  })
})
