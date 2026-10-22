import {Schema} from '@sanity/schema'
import {defineField, defineType, isObjectSchemaType, type ObjectSchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentPaneContextValue} from '../../DocumentPaneContext'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitleField} from '../useDocumentTitleField'

vi.mock('../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const schema = Schema.compile({
  name: 'test',
  types: [
    defineType({
      name: 'article',
      type: 'document',
      fields: [defineField({name: 'title', type: 'string'})],
      preview: {select: {title: 'title'}},
    }),
    defineType({
      name: 'person',
      type: 'document',
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

function paneState(overrides: Partial<DocumentPaneContextValue> = {}): DocumentPaneContextValue {
  return {
    schemaType: schemaType('article'),
    formState: {readOnly: false},
    onFocus: vi.fn(),
    onPathOpen: vi.fn(),
    ...overrides,
  } as unknown as DocumentPaneContextValue
}

describe('useDocumentTitleField', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReturnValue(paneState())
  })

  it('resolves the select.title field and focuses it through the pane', () => {
    const calls: string[] = []
    const state = paneState({
      onPathOpen: vi.fn(() => calls.push('open')),
      onFocus: vi.fn(() => calls.push('focus')),
    })
    mockUseDocumentPane.mockReturnValue(state)

    const {result} = renderHook(() => useDocumentTitleField())

    expect(result.current.path).toEqual(['title'])
    expect(result.current.editable).toBe(true)

    result.current.focus()

    expect(state.onPathOpen).toHaveBeenCalledExactlyOnceWith(['title'])
    expect(state.onFocus).toHaveBeenCalledExactlyOnceWith(['title'])
    // The field's ancestors must be open before focus lands on it.
    expect(calls).toEqual(['open', 'focus'])
  })

  it('is not editable on a read-only form', () => {
    mockUseDocumentPane.mockReturnValue(
      paneState({formState: {readOnly: true} as DocumentPaneContextValue['formState']}),
    )

    const {result} = renderHook(() => useDocumentTitleField())

    expect(result.current.path).toEqual(['title'])
    expect(result.current.editable).toBe(false)
  })

  it('is not editable before the form state exists', () => {
    mockUseDocumentPane.mockReturnValue(paneState({formState: null}))

    const {result} = renderHook(() => useDocumentTitleField())

    expect(result.current.editable).toBe(false)
  })

  it('has no field when the title comes from prepare() and several fields', () => {
    const state = paneState({schemaType: schemaType('person')})
    mockUseDocumentPane.mockReturnValue(state)

    const {result} = renderHook(() => useDocumentTitleField())

    expect(result.current.path).toBeUndefined()
    expect(result.current.editable).toBe(false)

    result.current.focus()

    expect(state.onPathOpen).not.toHaveBeenCalled()
    expect(state.onFocus).not.toHaveBeenCalled()
  })
})
