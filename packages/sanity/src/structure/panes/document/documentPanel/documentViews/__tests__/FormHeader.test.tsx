import {type ObjectSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {FormHeader} from '../FormHeader'

vi.mock('sanity', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useTranslation: vi.fn(() => ({t: (key: string) => key})),
  }
})
describe('FormHeader', () => {
  const mockSchemaType: ObjectSchemaType = {
    name: 'testType',
    title: 'Test Type',
    fields: [],
    jsonType: 'object',
  }

  it('renders with description', async () => {
    const schemaTypeWithDescription = {
      ...mockSchemaType,
      description: 'Test description',
    }

    const wrapper = await createTestProvider()

    render(
      <FormHeader documentId="test-id" schemaType={schemaTypeWithDescription} title="Test Title" />,
      {wrapper},
    )

    // Check if the description tooltip is present
    expect(screen.getByTestId('schema-description-icon')).toBeInTheDocument()
  })

  it('does not render description when not provided', async () => {
    const wrapper = await createTestProvider()

    render(<FormHeader documentId="test-id" schemaType={mockSchemaType} title="Test Title" />, {
      wrapper,
    })

    // Check that the info icon is not present
    expect(screen.queryByTestId('schema-description-icon')).not.toBeInTheDocument()
  })
})
