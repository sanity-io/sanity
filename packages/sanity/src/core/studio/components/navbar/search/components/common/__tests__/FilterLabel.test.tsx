import {type SanityClient} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {SearchProvider} from '../../../contexts/search/SearchProvider'
import {type SearchFilter} from '../../../types'
import {FilterLabel} from '../FilterLabel'

describe('FilterLabel', () => {
  const mockFilter: SearchFilter = {
    fieldId: 'boolean-title-boolean-test',
    filterName: 'boolean',
    operatorType: 'booleanEqual',
    value: true,
  }

  const schema = {
    types: [
      {
        name: 'test',
        type: 'document',
        fields: [
          {
            name: 'title',
            type: 'boolean',
          },
        ],
      },
    ],
  }

  const client = createMockSanityClient() as unknown as SanityClient

  test('renders the filter label with field, operator, and value', async () => {
    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema,
      },
    })
    render(
      <TestProvider>
        <SearchProvider>
          <FilterLabel filter={mockFilter} />
        </SearchProvider>
      </TestProvider>,
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('is')).toBeInTheDocument()
    expect(screen.getByText('True')).toBeInTheDocument()
  })

  test('renders only the field when showContent is false', async () => {
    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema,
      },
    })
    render(
      <TestProvider>
        <SearchProvider>
          <FilterLabel filter={mockFilter} showContent={false} />
        </SearchProvider>
      </TestProvider>,
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.queryByText('is')).not.toBeInTheDocument()
    expect(screen.queryByText('True')).not.toBeInTheDocument()
  })

  test('handles missing operator descriptionKey', async () => {
    const filterWithoutDescription: SearchFilter = {
      ...mockFilter,
      operatorType: 'unknown',
    }

    const TestProvider = await createTestProvider({
      client,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema,
      },
    })

    render(
      <TestProvider>
        <SearchProvider>
          <FilterLabel filter={filterWithoutDescription} />
        </SearchProvider>
      </TestProvider>,
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.queryByText('is')).not.toBeInTheDocument()
    expect(screen.queryByText('True')).not.toBeInTheDocument()
  })
})
