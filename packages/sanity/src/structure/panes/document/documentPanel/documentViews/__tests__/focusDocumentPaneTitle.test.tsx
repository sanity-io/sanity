import {Schema} from '@sanity/schema'
import {defineField, defineType, isObjectSchemaType, type ObjectSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {PaneHeader} from '../../../../../components/pane/PaneHeader'
import {usePane} from '../../../../../components/pane/usePane'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentTitle} from '../../../useDocumentTitle'
import {DocumentHeaderTitle} from '../../header/DocumentHeaderTitle'
import {focusDocumentPaneTitle} from '../focusDocumentPaneTitle'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(() => ({title: 'Letters from the North Ridge', error: undefined})),
}))

vi.mock('../../../../../components/pane/usePane', () => ({
  usePane: vi.fn(),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({setView: vi.fn()})),
}))

const schema = Schema.compile({
  name: 'test',
  types: [
    defineType({
      name: 'book',
      type: 'document',
      fields: [defineField({name: 'title', type: 'string'})],
      preview: {select: {title: 'title'}},
    }),
    defineType({
      name: 'species',
      type: 'document',
      fields: [
        defineField({name: 'genus', type: 'string'}),
        defineField({name: 'species', type: 'string'}),
      ],
      preview: {
        select: {genus: 'genus', species: 'species'},
        prepare: ({genus, species}) => ({title: `${genus} ${species}`}),
      },
    }),
  ],
})

function schemaType(name: string): ObjectSchemaType {
  const type = schema.get(name)
  if (!isObjectSchemaType(type)) {
    throw new Error(`Expected ${name} to be an object schema type`)
  }
  return type
}

function paneState(overrides: Partial<DocumentPaneContextValue> = {}): DocumentPaneContextValue {
  return {
    connectionState: 'connected',
    schemaType: schemaType('book'),
    value: {_id: 'book-1', _type: 'book', title: 'Letters from the North Ridge'},
    activeViewId: 'editor',
    views: [{id: 'editor', type: 'form', title: 'Editor'}],
    formState: {readOnly: false},
    onFocus: vi.fn(),
    onPathOpen: vi.fn(),
    index: 0,
    ...overrides,
  } as unknown as DocumentPaneContextValue
}

/** A document pane as `DocumentPanel` lays it out: the header with the title, then the form. */
function DocumentPaneMarkup(props: {id: string}) {
  return (
    <div data-ui="Pane" data-testid={`pane-${props.id}`}>
      <PaneHeader title={<DocumentHeaderTitle />} tabIndex={-1} />
      <form data-testid={`form-${props.id}`}>
        <input aria-label={`First input of ${props.id}`} />
      </form>
    </div>
  )
}

describe('focusDocumentPaneTitle', () => {
  let wrapper: ComponentType<{children: ReactNode}>

  beforeAll(async () => {
    wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  })

  beforeEach(() => {
    vi.mocked(useDocumentPane).mockReturnValue(paneState())
    vi.mocked(useDocumentTitle).mockReturnValue({
      title: 'Letters from the North Ridge',
      error: undefined,
    })
    vi.mocked(usePane).mockReturnValue({
      collapsed: false,
      isLast: true,
      collapse: vi.fn(),
      expand: vi.fn(),
      rootElement: null,
    } as unknown as ReturnType<typeof usePane>)
  })

  it('focuses the title button when the document title is editable', async () => {
    render(<DocumentPaneMarkup id="a" />, {wrapper})
    const titleButton = await screen.findByTestId('document-pane-title-field')

    expect(focusDocumentPaneTitle(screen.getByTestId('form-a'))).toBe(true)
    expect(titleButton).toHaveFocus()
    expect(titleButton).toHaveAccessibleName('Letters from the North Ridge')
  })

  it('focuses the header title when the title is not an editable field', async () => {
    vi.mocked(useDocumentPane).mockReturnValue(
      paneState({
        schemaType: schemaType('species'),
        value: {_id: 'species-1', _type: 'species', genus: 'Bubo', species: 'scandiacus'},
      }),
    )
    vi.mocked(useDocumentTitle).mockReturnValue({title: 'Bubo scandiacus', error: undefined})
    render(<DocumentPaneMarkup id="a" />, {wrapper})
    await screen.findByText('Bubo scandiacus')
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()

    expect(focusDocumentPaneTitle(screen.getByTestId('form-a'))).toBe(true)
    const focused = document.activeElement
    expect(focused).toHaveAttribute('data-pane-header-title')
    expect(focused).toHaveTextContent('Bubo scandiacus')
    // Programmatic focus target only: Tab order stays as it was.
    expect(focused).toHaveAttribute('tabindex', '-1')
  })

  it('focuses the header title of a read-only document', async () => {
    vi.mocked(useDocumentPane).mockReturnValue(
      paneState({formState: {readOnly: true} as DocumentPaneContextValue['formState']}),
    )
    render(<DocumentPaneMarkup id="a" />, {wrapper})
    await screen.findByText('Letters from the North Ridge')

    expect(focusDocumentPaneTitle(screen.getByTestId('form-a'))).toBe(true)
    expect(document.activeElement).toHaveAttribute('data-pane-header-title')
  })

  it('focuses the title of the pane the form is in when panes are split', async () => {
    render(
      <>
        <DocumentPaneMarkup id="left" />
        <DocumentPaneMarkup id="right" />
      </>,
      {wrapper},
    )
    const [, rightTitle] = await screen.findAllByTestId('document-pane-title-field')

    expect(focusDocumentPaneTitle(screen.getByTestId('form-right'))).toBe(true)
    expect(rightTitle).toHaveFocus()
    expect(screen.getByTestId('pane-right')).toContainElement(rightTitle)
  })

  it('returns false outside a pane', () => {
    render(<form data-testid="lonely-form" />)

    expect(focusDocumentPaneTitle(screen.getByTestId('lonely-form'))).toBe(false)
  })
})
