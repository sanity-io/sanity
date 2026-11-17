import {type ObjectSchemaType} from '@sanity/types'
import {render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {FormHeader} from '../FormHeader'

vi.mock('sanity', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useTranslation: vi.fn(() => ({t: (key: string) => key})),
    defineLocaleResourceBundle: vi.fn((bundle) => bundle),
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

    const button = screen.getByRole('button', {name: 'Test description'})
    expect(button).toContainElement(screen.getByTestId('schema-description-icon'))
    expect(button).toHaveAttribute('type', 'button')
  })

  it('opens the schema description tooltip from keyboard focus', async () => {
    const user = userEvent.setup()
    const schemaTypeWithDescription = {
      ...mockSchemaType,
      description: 'Test description',
    }

    const wrapper = await createTestProvider()

    render(
      <FormHeader documentId="test-id" schemaType={schemaTypeWithDescription} title="Test Title" />,
      {wrapper},
    )

    // The tooltip stays mounted while closed. Focusing the button is what reveals it.
    expect(screen.getByText('Test description')).not.toBeVisible()

    await user.tab()

    expect(screen.getByRole('button', {name: 'Test description'})).toHaveFocus()
    // The tooltip waits out its open delay before revealing the description.
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeVisible()
    })
  })

  it('does not render description when not provided', async () => {
    const wrapper = await createTestProvider()

    render(<FormHeader documentId="test-id" schemaType={mockSchemaType} title="Test Title" />, {
      wrapper,
    })

    // Check that the info icon is not present
    expect(screen.queryByTestId('schema-description-icon')).not.toBeInTheDocument()
  })

  it('renders the title as plain heading text without a title click handler', async () => {
    const wrapper = await createTestProvider()

    render(<FormHeader documentId="test-id" schemaType={mockSchemaType} title="Test Title" />, {
      wrapper,
    })

    const heading = screen.getByTestId('document-panel-document-title')
    expect(heading).toHaveTextContent('Test Title')
    expect(within(heading).queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls the title click handler from a button inside the heading', async () => {
    const user = userEvent.setup()
    const onTitleClick = vi.fn()
    const wrapper = await createTestProvider()

    render(
      <FormHeader
        documentId="test-id"
        schemaType={mockSchemaType}
        title="Test Title"
        onTitleClick={onTitleClick}
      />,
      {wrapper},
    )

    const heading = screen.getByRole('heading', {level: 2, name: 'Test Title'})
    const button = within(heading).getByRole('button', {name: 'Test Title'})
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toBe(screen.getByTestId('document-panel-document-title-field'))

    await user.click(button)

    expect(onTitleClick).toHaveBeenCalledOnce()
  })

  it('keeps the untitled fallback clickable', async () => {
    const user = userEvent.setup()
    const onTitleClick = vi.fn()
    const wrapper = await createTestProvider()

    render(
      <FormHeader documentId="test-id" schemaType={mockSchemaType} onTitleClick={onTitleClick} />,
      {wrapper},
    )

    // `useTranslation` is mocked to return the key.
    await user.click(
      screen.getByRole('button', {name: 'document-view.form-view.form-title-fallback'}),
    )

    expect(onTitleClick).toHaveBeenCalledOnce()
  })
})
