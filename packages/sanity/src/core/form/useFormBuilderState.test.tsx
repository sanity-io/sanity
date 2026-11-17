import {Schema} from '@sanity/schema'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type Path,
} from '@sanity/types'
import {act, render, renderHook} from '@testing-library/react'
import {useEffect, useMemo} from 'react'
import {describe, expect, test, vi} from 'vitest'

import {EMPTY_ARRAY} from '../util/empty'
import {applyAll} from './patch/applyPatch'
import {set, unset} from './patch/patch'
import {PatchEvent} from './patch/PatchEvent'
import {createPrepareFormState} from './store/formState'
import {type FormState} from './store/useFormState'
import {
  useBindFormBuilderState,
  useFormBuilderState,
  useFormPatchHandler,
} from './useFormBuilderState'

const schema = Schema.compile({
  name: 'test',
  types: [
    defineType({
      name: 'article',
      type: 'document',
      groups: [{name: 'main', default: true}, {name: 'seo'}],
      fieldsets: [{name: 'meta', options: {collapsible: true, collapsed: true}}],
      fields: [
        defineField({name: 'title', type: 'string', group: 'main'}),
        defineField({name: 'description', type: 'string', group: 'seo'}),
        defineField({name: 'notes', type: 'string', fieldset: 'meta'}),
        defineField({
          name: 'body',
          type: 'object',
          options: {collapsible: true, collapsed: true},
          fields: [defineField({name: 'intro', type: 'string'})],
        }),
        defineField({
          name: 'items',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'item',
              fields: [defineField({name: 'label', type: 'string'})],
            }),
          ],
        }),
      ],
    }),
  ],
})

const schemaType = schema.get('article') as ObjectSchemaType

const documentValue = {
  _id: 'article-1',
  _type: 'article',
  items: [{_key: 'a', _type: 'item', label: 'One'}],
  body: {intro: 'Hello'},
}

const ITEM_PATH: Path = ['items', {_key: 'a'}]
const OTHER_ITEM_PATH: Path = ['items', {_key: 'b'}]

function prepareArticle(value: unknown): FormState | null {
  return createPrepareFormState()({
    schemaType,
    documentValue: value,
    comparisonValue: value,
    baseVariantValue: undefined,
    hasBaseVariant: false,
    hasUpstreamVersion: false,
    currentUser: {email: 'ada@sanity.io', id: 'ada', name: 'Ada', roles: []},
    hidden: undefined,
    readOnly: undefined,
    openPath: EMPTY_ARRAY,
    focusPath: EMPTY_ARRAY,
    presence: [],
    validation: [],
    fieldGroupState: undefined,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    perspective: 'published',
  })
}

function useHarness(props: {
  ready: boolean
  initialFocusPath?: Path
  onFocusPath?: (path: Path) => void
}) {
  const state = useFormBuilderState({
    initialFocusPath: props.initialFocusPath,
    onFocusPath: props.onFocusPath,
  })
  const formState = useMemo(() => prepareArticle(documentValue), [])
  useBindFormBuilderState(state, formState, props.ready)
  return state
}

describe('useFormBuilderState', () => {
  test('follows the focused field into the object that contains it', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathFocus([...ITEM_PATH, 'label']))

    expect(result.current.focusPath).toEqual([...ITEM_PATH, 'label'])
    expect(result.current.openPath).toEqual(ITEM_PATH)
  })

  test('keeps an open array item open when focus lands on the item itself', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(ITEM_PATH))
    expect(result.current.openPath).toEqual(ITEM_PATH)

    act(() => result.current.onPathFocus(ITEM_PATH))
    expect(result.current.openPath).toEqual(ITEM_PATH)
  })

  test('closes an open array item when focus moves to a sibling item', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(ITEM_PATH))
    act(() => result.current.onPathFocus(OTHER_ITEM_PATH))

    expect(result.current.focusPath).toEqual(OTHER_ITEM_PATH)
    expect(result.current.openPath).toEqual(['items'])
  })

  test('closes an open array item when focus moves to an unrelated field', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(ITEM_PATH))
    act(() => result.current.onPathFocus(['title']))

    expect(result.current.openPath).toEqual([])
  })

  test('stores collapsed paths, fieldsets, and the active field group', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => {
      result.current.onSetPathCollapsed(['body', 'intro'], true)
      result.current.onSetFieldSetCollapsed(['meta'], false)
      result.current.onFieldGroupSelect(['items', {_key: 'a'}], 'seo')
    })

    expect(result.current.collapsedPaths).toEqual({
      value: undefined,
      children: {
        body: {
          value: undefined,
          children: {intro: {value: true}},
        },
      },
    })
    expect(result.current.collapsedFieldSets).toEqual({
      value: undefined,
      children: {meta: {value: false}},
    })
    expect(result.current.fieldGroupState).toEqual({
      value: undefined,
      children: {
        items: {
          value: undefined,
          children: {a: {value: 'seo'}},
        },
      },
    })
  })

  test('expands a collapsed object when a path inside it opens', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(['body', 'intro']))

    expect(result.current.openPath).toEqual(['body', 'intro'])
    expect(result.current.collapsedPaths).toEqual({
      value: undefined,
      children: {
        body: {
          value: false,
          children: {intro: {value: false}},
        },
      },
    })
  })

  test('selects the field group that contains the opened field', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(['description']))

    expect(result.current.fieldGroupState).toEqual({value: 'seo'})
  })

  test('expands the fieldset that contains the opened field', () => {
    const {result} = renderHook(() => useHarness({ready: true}))

    act(() => result.current.onPathOpen(['notes']))

    expect(result.current.collapsedFieldSets).toEqual({
      value: undefined,
      children: {meta: {value: false}},
    })
  })

  test('does not open a path until a form state is bound', () => {
    const {result} = renderHook(() => useFormBuilderState())

    act(() => result.current.onPathOpen(['title']))

    expect(result.current.openPath).toEqual([])
  })

  test('reports the empty path on the first blur and not again', () => {
    const onFocusPath = vi.fn()
    const {result} = renderHook(() => useHarness({ready: true, onFocusPath}))

    act(() => result.current.onPathBlur(['title']))
    expect(result.current.focusPath).toEqual([])
    expect(onFocusPath).toHaveBeenCalledTimes(1)
    expect(onFocusPath).toHaveBeenCalledWith(EMPTY_ARRAY)

    act(() => result.current.onPathBlur(['title']))
    expect(onFocusPath).toHaveBeenCalledTimes(1)
  })

  test('reports blur after a field was focused', () => {
    const onFocusPath = vi.fn()
    const {result} = renderHook(() => useHarness({ready: true, onFocusPath}))

    act(() => result.current.onPathFocus(['title']))
    act(() => result.current.onPathBlur(['title']))

    expect(onFocusPath).toHaveBeenNthCalledWith(1, ['title'])
    expect(onFocusPath).toHaveBeenNthCalledWith(2, EMPTY_ARRAY)
    expect(result.current.focusPath).toEqual([])
  })

  test('ignores a repeated focus report for the path already focused', () => {
    const onFocusPath = vi.fn()
    const {result} = renderHook(() => useHarness({ready: true, onFocusPath}))

    act(() => result.current.onPathFocus(['title']))
    act(() => result.current.onPathFocus(['title']))

    expect(onFocusPath).toHaveBeenCalledTimes(1)
  })

  test('moves programmatic focus onto the path and ignores a repeat', () => {
    const onFocusPath = vi.fn()
    const {result} = renderHook(() => useHarness({ready: true, onFocusPath}))

    act(() => result.current.onProgrammaticFocus(['body', 'intro']))
    expect(result.current.focusPath).toEqual(['body', 'intro'])
    expect(result.current.openPath).toEqual(['body', 'intro'])
    expect(onFocusPath).toHaveBeenCalledTimes(1)

    act(() => result.current.onProgrammaticFocus(['body', 'intro']))
    expect(onFocusPath).toHaveBeenCalledTimes(1)
  })

  test('resolves the initial focus path once the form is ready', () => {
    const onFocusPath = vi.fn()
    const {result, rerender} = renderHook(
      ({ready}: {ready: boolean}) =>
        useHarness({
          ready,
          initialFocusPath: ['items', 0, 'label'],
          onFocusPath,
        }),
      {initialProps: {ready: false}},
    )

    expect(result.current.focusPath).toEqual(['items', 0, 'label'])
    expect(onFocusPath).not.toHaveBeenCalled()

    rerender({ready: true})

    expect(result.current.focusPath).toEqual(['items', {_key: 'a'}, 'label'])
    expect(result.current.openPath).toEqual(['items', {_key: 'a'}, 'label'])
    expect(onFocusPath).toHaveBeenCalledTimes(1)

    rerender({ready: true})
    expect(onFocusPath).toHaveBeenCalledTimes(1)
  })
})

function PatchOnMount(props: {
  value: {title: string}
  onValueChange: (next: {title: string}) => void
}) {
  const onChange = useFormPatchHandler(props.value, props.onValueChange)
  useEffect(() => {
    onChange(new PatchEvent([set('from-effect', ['title'])]))
  }, [onChange])
  return null
}

describe('useFormPatchHandler', () => {
  test('applies every patch in the event to the latest value', () => {
    const onValueChange = vi.fn()
    const {result, rerender} = renderHook(
      (props: {
        value: {title: string; count: number}
        publish: (next: {title: string; count: number}) => void
      }) => useFormPatchHandler(props.value, props.publish),
      {initialProps: {value: {title: 'a', count: 1}, publish: onValueChange}},
    )

    act(() => {
      result.current(new PatchEvent([set('b', ['title']), set(2, ['count'])]))
    })
    expect(onValueChange).toHaveBeenCalledWith({title: 'b', count: 2})

    const handler = result.current
    const nextPublish = vi.fn()
    rerender({value: {title: 'b', count: 2}, publish: nextPublish})
    act(() => {
      result.current(new PatchEvent([unset(['count'])]))
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(nextPublish).toHaveBeenCalledWith({title: 'b'})
    expect(result.current).toBe(handler)
  })

  test('applies a patch emitted from a mount effect', () => {
    const onValueChange = vi.fn()

    render(<PatchOnMount value={{title: 'a'}} onValueChange={onValueChange} />)

    expect(onValueChange).toHaveBeenCalledWith({title: 'from-effect'})
  })

  test('matches applyAll for an empty patch list', () => {
    const value = {title: 'a'}
    const onValueChange = vi.fn()
    const {result} = renderHook(() => useFormPatchHandler(value, onValueChange))

    act(() => {
      result.current(new PatchEvent([]))
    })

    expect(onValueChange).toHaveBeenCalledWith(applyAll(value, []))
  })
})
