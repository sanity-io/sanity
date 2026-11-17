import {defineType, type DocumentVersionKind} from '@sanity/types'
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

  describe('versions', () => {
    const inRelease = {selectedReleaseId: 'rA', selectedPerspectiveName: 'rA'}
    const inVariant = {selectedVariantNames: ['alpha']}

    async function renderOption(
      versions: DocumentVersionKind[],
      perspective: Partial<PerspectiveContextValue>,
    ) {
      const wrapper = await createTestProvider({
        config: {
          schema: {
            types: [
              defineType({
                name: 'settings',
                type: 'document',
                versions,
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
      return screen.getByTestId('create-new-test-template')
    }

    test.each<[DocumentVersionKind[], string, Partial<PerspectiveContextValue>]>([
      [['variants'], 'a release', inRelease],
      [[], 'a release', inRelease],
      [['releases'], 'a variant', inVariant],
      [[], 'a variant', inVariant],
    ])('disables a `versions: %j` type while %s is selected', async (versions, _l, perspective) => {
      expect(await renderOption(versions, perspective)).toBeDisabled()
    })

    test.each<[DocumentVersionKind[], string, Partial<PerspectiveContextValue>]>([
      [['releases'], 'a release', inRelease],
      [['variants'], 'a variant', inVariant],
      [[], 'neither', {}],
    ])(
      'lets a `versions: %j` type be created while %s is selected',
      async (versions, _l, perspective) => {
        expect(await renderOption(versions, perspective)).toHaveAttribute('href', '/test')
      },
    )
  })
})
