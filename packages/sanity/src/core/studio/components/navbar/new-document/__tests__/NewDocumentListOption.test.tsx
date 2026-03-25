import {render, screen} from '@testing-library/react'
import {describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {NewDocumentListOption} from '../NewDocumentListOption'
import {type NewDocumentOption, type PreviewLayout} from '../types'

vi.mock('sanity/router', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    useIntentLink: () => ({onClick: vi.fn(), href: '/test'}),
  }
})

function TestIcon() {
  return <svg data-testid="template-icon" />
}

function createOption(overrides: Partial<NewDocumentOption> = {}): NewDocumentOption {
  return {
    id: 'test-option',
    type: 'initialValueTemplateItem',
    templateId: 'test-template',
    schemaType: 'author',
    title: 'Test Option',
    hasPermission: true,
    ...overrides,
  }
}

const defaultProps = {
  currentUser: {id: 'user1', name: 'Test User', email: 'test@test.com', role: '', roles: []},
  onClick: vi.fn(),
  preview: 'inline' as PreviewLayout,
}

describe('NewDocumentListOption', () => {
  test('renders icon when option has an icon component', async () => {
    const wrapper = await createTestProvider()
    const option = createOption({icon: TestIcon})

    render(<NewDocumentListOption {...defaultProps} option={option} />, {wrapper})

    expect(screen.getByTestId('template-icon')).toBeInTheDocument()
    expect(screen.getByText('Test Option')).toBeInTheDocument()
  })

  test('renders icon when option has a JSX element icon', async () => {
    const wrapper = await createTestProvider()
    const iconElement = <svg data-testid="jsx-icon" />
    const option = createOption({icon: iconElement})

    render(<NewDocumentListOption {...defaultProps} option={option} />, {wrapper})

    expect(screen.getByTestId('jsx-icon')).toBeInTheDocument()
    expect(screen.getByText('Test Option')).toBeInTheDocument()
  })

  test('renders without icon when option has no icon', async () => {
    const wrapper = await createTestProvider()
    const option = createOption()

    render(<NewDocumentListOption {...defaultProps} option={option} />, {wrapper})

    expect(screen.getByText('Test Option')).toBeInTheDocument()
    expect(screen.queryByTestId('template-icon')).toBeNull()
  })
})
