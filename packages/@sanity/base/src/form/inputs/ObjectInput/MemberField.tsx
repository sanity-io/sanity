import React, {memo, useRef} from 'react'
import {isArraySchemaType, isObjectSchemaType} from '@sanity/types'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {FieldMember, RenderFieldCallback} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {ChangeIndicatorProvider} from '../../../components/changeIndicators'

export interface MemberFieldProps {
  member: FieldMember
  renderField?: RenderFieldCallback
}

/**
 * The responsibility of this component is to:
 * Get the correct values from context, define the correct onChange/onFocus callbacks etc.
 * and provide it for the renderField callback. Since fields of different data types expects different props we branch
 * out based on the schema type we use for the
 */
export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {renderField: defaultRenderField} = useFormBuilder()
  const {member, renderField = defaultRenderField} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  if (isObjectSchemaType(member.field.type)) {
    return <ObjectField member={member} renderField={renderField} />
  }
  if (isArraySchemaType(member.field.type)) {
    return <ArrayField member={member} renderField={renderField} />
  }

  return <PrimitiveField member={member} renderField={renderField} />
})

const ObjectField = memo(function ObjectField(props: {
  member: FieldMember // todo: type as a member with an object as its type
  renderField: RenderFieldCallback
}) {
  const {member, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  // here we want to handle fields of different the different types differently to make sure they get passed in just the values they need
  return (
    <ChangeIndicatorProvider
      path={member.field.path}
      value={member.field.value}
      compareValue={undefined}
    >
      {renderField({...member, field: {...member.field, focusRef}})}
    </ChangeIndicatorProvider>
  )
})

// Note: this is an object field of an array type
const ArrayField = memo(function ArrayField(props: {
  member: FieldMember // todo: type as a member with an array as its type
  renderField: RenderFieldCallback
}) {
  const {member, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  // here we want to handle fields of different the different types differently to make sure they get passed in just the values they need
  return (
    <ChangeIndicatorProvider
      path={member.field.path}
      value={member.field.value}
      compareValue={undefined}
    >
      {renderField({...member, field: {...member.field, focusRef}})}
    </ChangeIndicatorProvider>
  )
})

const PrimitiveField = memo(function PrimitiveField(props: {
  member: FieldMember // todo: type as a member with a primitive type
  renderField: RenderFieldCallback
}) {
  const {member, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  // here we want to handle fields of different the different types differently to make sure they get passed in just the values they need
  return (
    <ChangeIndicatorProvider
      path={member.field.path}
      value={member.field.value}
      compareValue={undefined}
    >
      {renderField({...member, field: {...member.field, focusRef}})}
    </ChangeIndicatorProvider>
  )
})
