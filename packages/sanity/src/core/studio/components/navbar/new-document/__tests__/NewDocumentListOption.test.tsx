import {defineType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {PerspectiveContext} from 'sanity/_singletons'
import {describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {perspectiveContextValueMock} from '../../../../../perspective/__mocks__/usePerspective.mock'
import {type PerspectiveContextValue} from '../../../../../perspective/types'
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

  describe('a type that does not allow versions', () => {
    async function renderOption(perspective: Partial<PerspectiveContextValue>) {
      const wrapper = await createTestProvider({
        config: {
          schema: {
            types: [
              defineType({
                name: 'settings',
                type: 'document',
                allowVersions: false,
                fields: [{name: 'title', type: 'string'}],
              }),
            ],
          },
        },
      })
      render(
        <PerspectiveContext.Provider value={{...perspectiveContextValueMock, ...perspective}}>
          <NewDocumentListOption
            {...defaultProps}
            option={createOption({schemaType: 'settings'})}
          />
        </PerspectiveContext.Provider>,
        {wrapper},
      )
    }

    test.each([
      ['a release', {selectedReleaseId: 'rA', selectedPerspectiveName: 'rA'}],
      ['a variant', {selectedVariantName: 'alpha', selectedVariantNames: ['alpha']}],
    ])('is disabled while %s is selected', async (_label, perspective) => {
      await renderOption(perspective)

      expect(screen.getByTestId('create-new-test-template')).toBeDisabled()
    })

    test('can be created outside releases and variants', async () => {
      await renderOption({})

      expect(screen.getByTestId('create-new-test-template')).toHaveAttribute('href', '/test')
    })
  })
})
