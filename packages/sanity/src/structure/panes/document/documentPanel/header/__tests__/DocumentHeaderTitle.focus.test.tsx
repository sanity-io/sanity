import {Schema} from '@sanity/schema'
import {defineField, defineType, isObjectSchemaType, type ObjectSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {usePane} from '../../../../../components/pane/usePane'
import {usePaneRouter} from '../../../../../components/paneRouter/usePaneRouter'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentTitle} from '../../../useDocumentTitle'
import {DocumentHeaderTitle} from '../DocumentHeaderTitle'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(() => ({title: 'Hello', error: undefined})),
}))

vi.mock('../../../../../components/pane/usePane', () => ({
  usePane: vi.fn(() => ({collapsed: false, isLast: true})),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({setView: vi.fn()})),
}))

const schema = Schema.compile({
  name: 'test',
  types: [
    defineType({
      name: 'article',
      type: 'document',
      title: 'Article',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({
          name: 'seo',
          type: 'object',
          fields: [defineField({name: 'metaTitle', type: 'string'})],
        }),
      ],
      preview: {select: {title: 'title'}},
    }),
    defineType({
      name: 'person',
      type: 'document',
      title: 'Person',
      fields: [
        defineField({name: 'firstName', type: 'string'}),
        defineField({name: 'lastName', type: 'string'}),
      ],
      preview: {
        select: {firstName: 'firstName', lastName: 'lastName'},
        prepare: ({firstName, lastName}) => ({title: `${firstName} ${lastName}`}),
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

const mockUseDocumentPane = vi.mocked(useDocumentPane)
const mockUseDocumentTitle = vi.mocked(useDocumentTitle)
const mockUsePane = vi.mocked(usePane)
const mockUsePaneRouter = vi.mocked(usePaneRouter)

const formView = {id: 'editor', type: 'form' as const, title: 'Editor'}
const jsonView = {id: 'json', type: 'component' as const, title: 'JSON'}

function paneState(overrides: Partial<DocumentPaneContextValue> = {}): DocumentPaneContextValue {
  return {
    connectionState: 'connected',
    schemaType: schemaType('article'),
    value: {_id: 'article-1', _type: 'article', title: 'Hello'},
    activeViewId: 'editor',
    views: [formView],
    formState: {readOnly: false},
    onFocus: vi.fn(),
    onPathOpen: vi.fn(),
    index: 0,
    ...overrides,
  } as unknown as DocumentPaneContextValue
}

describe('DocumentHeaderTitle title field focus', () => {
  let wrapper: ComponentType<{children: ReactNode}>

  beforeAll(async () => {
    wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  })

  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(paneState())
    mockUseDocumentTitle.mockReturnValue({title: 'Hello', error: undefined})
    mockUsePane.mockReturnValue({collapsed: false, isLast: true} as ReturnType<typeof usePane>)
    mockUsePaneRouter.mockReturnValue({setView: vi.fn()} as unknown as ReturnType<
      typeof usePaneRouter
    >)
  })

  it('opens and focuses the select.title field when the title is clicked', async () => {
    const user = userEvent.setup()
    const onPaneClick = vi.fn()
    const state = paneState()
    mockUseDocumentPane.mockReturnValue(state)

    render(
      <div onClick={onPaneClick} onKeyDown={onPaneClick}>
        <DocumentHeaderTitle />
      </div>,
      {wrapper},
    )

    const title = await screen.findByTestId('document-pane-title-field')
    expect(title.tagName).toBe('BUTTON')
    expect(title).toHaveAttribute('type', 'button')
    expect(title).toHaveAccessibleName('Hello')

    await user.click(title)

    expect(state.onPathOpen).toHaveBeenCalledExactlyOnceWith(['title'])
    expect(state.onFocus).toHaveBeenCalledExactlyOnceWith(['title'])
    expect(onPaneClick).not.toHaveBeenCalled()
  })

  it('focuses a nested select.title path', async () => {
    const user = userEvent.setup()
    const compiled = Schema.compile({
      name: 'nested',
      types: [
        defineType({
          name: 'article',
          type: 'document',
          fields: [
            defineField({
              name: 'seo',
              type: 'object',
              fields: [defineField({name: 'metaTitle', type: 'string'})],
            }),
          ],
          preview: {select: {title: 'seo.metaTitle'}},
        }),
      ],
    }).get('article')
    if (!isObjectSchemaType(compiled)) {
      throw new Error('Expected article to be an object schema type')
    }
    const nested = compiled
    const state = paneState({schemaType: nested})
    mockUseDocumentPane.mockReturnValue(state)

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByTestId('document-pane-title-field'))

    expect(state.onPathOpen).toHaveBeenCalledExactlyOnceWith(['seo', 'metaTitle'])
    expect(state.onFocus).toHaveBeenCalledExactlyOnceWith(['seo', 'metaTitle'])
  })

  it('switches to the form view before focusing when another view is active', async () => {
    const user = userEvent.setup()
    const setView = vi.fn()
    mockUsePaneRouter.mockReturnValue({setView} as unknown as ReturnType<typeof usePaneRouter>)
    const state = paneState({
      activeViewId: 'json',
      views: [formView, jsonView] as DocumentPaneContextValue['views'],
    })
    mockUseDocumentPane.mockReturnValue(state)

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByTestId('document-pane-title-field'))

    expect(setView).toHaveBeenCalledExactlyOnceWith(null)
    expect(state.onPathOpen).toHaveBeenCalledOnce()
    expect(state.onFocus).toHaveBeenCalledOnce()
  })

  it('selects a form view that is not the first view', async () => {
    const user = userEvent.setup()
    const setView = vi.fn()
    mockUsePaneRouter.mockReturnValue({setView} as unknown as ReturnType<typeof usePaneRouter>)
    mockUseDocumentPane.mockReturnValue(
      paneState({
        activeViewId: 'json',
        views: [jsonView, formView] as DocumentPaneContextValue['views'],
      }),
    )

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByTestId('document-pane-title-field'))

    expect(setView).toHaveBeenCalledExactlyOnceWith('editor')
  })

  it('does not change the view when the form is already showing', async () => {
    const user = userEvent.setup()
    const setView = vi.fn()
    mockUsePaneRouter.mockReturnValue({setView} as unknown as ReturnType<typeof usePaneRouter>)

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByTestId('document-pane-title-field'))

    expect(setView).not.toHaveBeenCalled()
  })

  it('leaves a read-only document title as text', async () => {
    const user = userEvent.setup()
    const state = paneState({
      formState: {readOnly: true} as DocumentPaneContextValue['formState'],
    })
    mockUseDocumentPane.mockReturnValue(state)

    render(<DocumentHeaderTitle />, {wrapper})
    const title = await screen.findByText('Hello')
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()

    await user.click(title)
    expect(state.onFocus).not.toHaveBeenCalled()
    expect(state.onPathOpen).not.toHaveBeenCalled()
  })

  it('leaves the title as text while the pane is collapsed so the click can expand it', async () => {
    const user = userEvent.setup()
    const onPaneClick = vi.fn()
    mockUsePane.mockReturnValue({collapsed: true, isLast: true} as ReturnType<typeof usePane>)
    const state = paneState()
    mockUseDocumentPane.mockReturnValue(state)

    render(
      <div onClick={onPaneClick} onKeyDown={onPaneClick}>
        <DocumentHeaderTitle />
      </div>,
      {wrapper},
    )

    await user.click(await screen.findByText('Hello'))
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()
    expect(onPaneClick).toHaveBeenCalledOnce()
    expect(state.onFocus).not.toHaveBeenCalled()
  })

  it('does nothing when the title is derived from prepare() and several fields', async () => {
    mockUseDocumentPane.mockReturnValue(paneState({schemaType: schemaType('person')}))
    mockUseDocumentTitle.mockReturnValue({title: 'Ada Lovelace', error: undefined})

    render(<DocumentHeaderTitle />, {wrapper})
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()
  })

  it('focuses the title field from the new-document heading', async () => {
    const user = userEvent.setup()
    const state = paneState({value: undefined})
    mockUseDocumentPane.mockReturnValue(state)

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByRole('button', {name: 'New Article'}))

    expect(state.onPathOpen).toHaveBeenCalledExactlyOnceWith(['title'])
    expect(state.onFocus).toHaveBeenCalledExactlyOnceWith(['title'])
  })

  it('focuses the title field from an untitled document', async () => {
    const user = userEvent.setup()
    mockUseDocumentTitle.mockReturnValue({title: undefined, error: undefined})
    const state = paneState()
    mockUseDocumentPane.mockReturnValue(state)

    render(<DocumentHeaderTitle />, {wrapper})
    await user.click(await screen.findByRole('button', {name: 'Untitled'}))

    expect(state.onFocus).toHaveBeenCalledExactlyOnceWith(['title'])
  })

  it('does not make an error or a structure pane title focus the field', async () => {
    mockUseDocumentTitle.mockReturnValue({title: undefined, error: 'Broken preview'})
    const {rerender} = render(<DocumentHeaderTitle />, {wrapper})
    expect(await screen.findByText('Error: Broken preview')).toBeInTheDocument()
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()

    mockUseDocumentPane.mockReturnValue(paneState({title: 'Pinned pane title'}))
    rerender(<DocumentHeaderTitle />)
    expect(await screen.findByText('Pinned pane title')).toBeInTheDocument()
    expect(screen.queryByTestId('document-pane-title-field')).not.toBeInTheDocument()
  })
})
