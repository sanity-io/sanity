import {Schema} from '@sanity/schema'
import {type Reference} from '@sanity/types'
import {Root} from '@sanity/ui'
import {render} from '@testing-library/react'
import {noop} from 'lodash'
import {forwardRef, useImperativeHandle} from 'react'
import {of} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'

import {ReferenceInput} from '../ReferenceInput'
import {type ReferenceInfo, type ReferenceInputProps} from '../types'

const EMPTY_SEARCH = () => of([])

const AVAILABLE = {
  available: true,
  reason: 'READABLE',
} as const
const UNAVAILABLE_NOT_FOUND = {
  available: false,
  reason: 'NOT_FOUND',
} as const
const UNAVAILABLE_PERMISSION_DENIED = {
  available: false,
  reason: 'PERMISSION_DENIED',
} as const

const infinityNoop: any = new Proxy<any>(() => infinityNoop, {get: () => infinityNoop})
const StubComponent = forwardRef(
  ({documentId, documentType}: {documentId: string; documentType: string}, ref) => {
    useImperativeHandle(ref, () => infinityNoop, [])
    return null
  },
)

StubComponent.displayName = 'StubComponent'
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

function ReferenceInputTester(
  props: PartialExcept<ReferenceInputProps, 'schemaType' | 'getReferenceInfo'>,
) {
  const onFocus = vi.fn()
  const onChange = vi.fn()

  return (
    <RouterProvider router={route.intents('/intents')} state={{}} onNavigate={noop}>
      <Root as="div">
        <ReferenceInput
          elementProps={{onFocus, onChange, ref: {current: null}}}
          onChange={onChange}
          validation={[]}
          level={0}
          liveEdit={false}
          focusPath={[]}
          presence={[]}
          onSearch={EMPTY_SEARCH}
          createOptions={[]}
          editReferenceLinkComponent={StubComponent}
          onEditReference={noop}
          {...(props as any)}
        />
      </Root>
    </RouterProvider>
  )
}

function ReferenceInfoTester(
  props: Partial<Omit<ReferenceInputProps, 'getReferenceInfo' | 'type'>> & {
    referenceInfo: ReferenceInfo
    typeIsWeakRef?: boolean
    isEditing?: boolean
    value: Reference
  },
) {
  const schema = Schema.compile({
    types: [
      {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
      {name: 'actorReference', type: 'reference', weak: props.typeIsWeakRef, to: [{type: 'actor'}]},
    ],
  })

  return (
    <ReferenceInputTester
      getReferenceInfo={(id: string) => of(props.referenceInfo)}
      onSearch={EMPTY_SEARCH}
      focusPath={props.isEditing ? ['_ref'] : []}
      schemaType={schema.get('actorReference')}
      value={props.value}
    />
  )
}

const PUBLISHED_PREVIEW = {title: 'Actor (published)', description: ''}
const DRAFT_PREVIEW = {title: 'Actor (draft)', description: ''}

describe.skip('if schema type is a strong reference', () => {
  test('the UI does *NOT* show a warning if the draft exist and the reference value is weak and has a _strengthenOnPublish flag', () => {
    const {getByTestId, queryByTestId} = render(
      <ReferenceInfoTester
        value={{
          _type: 'reference',
          _ref: 'someActor',
          _weak: true,
          _strengthenOnPublish: {type: 'actor'},
        }}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            // @ts-expect-error - TODO: fix this
            published: undefined,
            draft: DRAFT_PREVIEW as any,
          },
        }}
      />,
    )

    expect(queryByTestId('alert-nonexistent-document')).toBe(null)
  })

  test('the UI shows a warning if the document is published and the value is is weak', () => {
    const {getByTestId, queryByTestId} = render(
      <ReferenceInfoTester
        value={{_type: 'reference', _weak: true, _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            // @ts-expect-error - TODO: fix this
            published: undefined,
            draft: DRAFT_PREVIEW as any,
          },
        }}
      />,
    )

    expect(queryByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})

describe.skip('if schema type is a weak reference', () => {
  test('the UI indicates that the referenced document does not exist', () => {
    const {getByTestId} = render(
      <ReferenceInfoTester
        typeIsWeakRef
        value={{_type: 'reference', _weak: true, _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: UNAVAILABLE_NOT_FOUND,
          preview: {
            // @ts-expect-error - TODO: fix this
            published: PUBLISHED_PREVIEW as any,
            draft: DRAFT_PREVIEW as any,
          },
        }}
      />,
    )

    expect(getByTestId('alert-nonexistent-document')).toBeInTheDocument()
  })

  test('a warning is visible if the reference value is strong while the schema says it should be weak', () => {
    const {getByTestId} = render(
      <ReferenceInfoTester
        typeIsWeakRef
        value={{_type: 'reference', _ref: 'someActor'}}
        referenceInfo={{
          id: 'someActor',
          type: 'actorReference',
          availability: AVAILABLE,
          preview: {
            // @ts-expect-error - TODO: fix this
            published: PUBLISHED_PREVIEW as any,
            draft: DRAFT_PREVIEW as any,
          },
        }}
      />,
    )

    expect(getByTestId('alert-reference-strength-mismatch')).toBeInTheDocument()
  })
})
