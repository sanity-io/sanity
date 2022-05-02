import React, {memo, useCallback, useMemo, useRef} from 'react'
import {isArraySchemaType, isObjectSchemaType} from '@sanity/types'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {FieldMember} from '../../store/types/members'
import {
  ObjectInputProps,
  PrimitiveInputProps,
  RenderFieldCallback,
  RenderInputCallback,
} from '../../types'
import {ArrayOfObjectsNode, ObjectNode} from '../../store/types/nodes'
import {FormCallbacksProvider, useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {PatchEvent, setIfMissing} from '../../patch'
import {createProtoValue} from '../../utils/createProtoValue'
import {
  ArrayFieldProps,
  ObjectFieldProps,
  FieldProps,
  PrimitiveFieldProps,
} from '../../types/fieldProps'

export interface MemberFieldProps {
  member: FieldMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
}

function isMemberAnObject(member: FieldMember): member is FieldMember<ObjectNode> {
  return isObjectSchemaType(member.field.schemaType)
}

function isMemberAnArray(member: FieldMember): member is FieldMember<ArrayOfObjectsNode> {
  return isArraySchemaType(member.field.schemaType)
}

/**
 * The responsibility of this component is to:
 * Get the correct values from context, define the correct onChange/onFocus callbacks etc.
 * and provide it for the renderField callback. Since fields of different data types expects different props we branch
 * out based on the schema type we use for the
 */
export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {member, renderField, renderInput} = props

  if (isMemberAnObject(member)) {
    // this field is of an object type
    return <ObjectField member={member} renderField={renderField} renderInput={renderInput} />
  }

  if (isMemberAnArray(member)) {
    return <ArrayField member={member} renderField={renderField} />
  }

  return <PrimitiveField member={member} renderField={renderField} renderInput={renderInput} />
})

const ObjectField = memo(function ObjectField(props: {
  member: FieldMember<ObjectNode>
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
}) {
  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onSetCollapsedPath,
    onSetCollapsedFieldSet,
    onSelectFieldGroup,
  } = useFormCallbacks()
  const {member, renderField, renderInput} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur(member.field.path)
    },
    [member.field.path, onPathBlur]
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.field.path)
    },
    [member.field.path, onPathFocus]
  )

  const handleChange = useCallback(
    (event: PatchEvent) => {
      onChange(
        event
          .prepend(setIfMissing(createProtoValue(member.field.schemaType)))
          .prefixAll(member.name)
      )
    },
    [onChange, member.field.schemaType, member.name]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetCollapsedPath(member.field.path, collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onSelectFieldGroup(member.field.path, groupName)
    },
    [onSelectFieldGroup, member.field.path]
  )

  const handleSetFieldSetCollapsed = useCallback(
    (fieldsetName: string, collapsed: boolean) => {
      onSetCollapsedFieldSet(member.field.path, collapsed)
    },
    [onSetCollapsedFieldSet, member.field.path]
  )
  const handleSetFieldCollapsed = useCallback(
    (fieldName: string, collapsed: boolean) => {
      onSetCollapsedPath(member.field.path.concat(fieldName), collapsed)
    },
    [onSetCollapsedPath, member.field.path]
  )

  const inputProps = useMemo((): ObjectInputProps => {
    return {
      level: member.field.level,
      onBlur: handleBlur,
      members: member.field.members,
      value: member.field.value,
      readOnly: member.field.readOnly,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue,
      focusRef: focusRef,
      id: member.field.id,
      onSelectFieldGroup: handleSelectFieldGroup,
      onSetFieldSetCollapsed: handleSetFieldSetCollapsed,
      onSetFieldCollapsed: handleSetFieldCollapsed,
      onFocus: handleFocus,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      groups: member.field.groups,
      onChange: handleChange,
      renderField,
      renderInput,
    }
  }, [
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.compareValue,
    member.field.id,
    member.field.path,
    member.field.focusPath,
    member.field.focused,
    member.field.groups,
    handleBlur,
    handleSetCollapsed,
    handleSelectFieldGroup,
    handleSetFieldSetCollapsed,
    handleSetFieldCollapsed,
    handleFocus,
    handleChange,
    renderField,
    renderInput,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): ObjectFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      children: renderedInput,
    }
  }, [
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.collapsible,
    member.collapsed,
    member.index,
    member.name,
    renderedInput,
    handleSetCollapsed,
  ])

  return (
    <FormCallbacksProvider
      onSelectFieldGroup={onSelectFieldGroup}
      onChange={handleChange}
      onSetCollapsedFieldSet={onSetCollapsedFieldSet}
      onSetCollapsedPath={onSetCollapsedPath}
      onPathBlur={onPathBlur}
      onPathFocus={onPathBlur}
    >
      {renderField(fieldProps)}
    </FormCallbacksProvider>
  )
})

// Note: this is an object field of an array type
const ArrayField = memo(function ArrayField(props: {
  member: FieldMember // todo: type as a member with an array as its type
  renderField: RenderInputCallback<ArrayFieldProps>
}) {
  const {member, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  return <div>TOOD Array Field</div>
  // return <>{renderField({...member, field: {...member.field, focusRef}})}</>
})

const PrimitiveField = memo(function PrimitiveField(props: {
  member: FieldMember // todo: type as a member with a primitive type
  renderInput: RenderInputCallback<PrimitiveInputProps>
  renderField: RenderFieldCallback<PrimitiveFieldProps>
}) {
  const {member, renderInput, renderField} = props
  const focusRef = useRef<{focus: () => void}>()

  const {onPathBlur, onPathFocus, onChange} = useFormCallbacks()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      onPathBlur(member.field.path)
    },
    [member.field.path, onPathBlur]
  )

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      onPathFocus(member.field.path)
    },
    [member.field.path, onPathFocus]
  )

  const handleChange = useCallback(
    (event: PatchEvent) => {
      onChange(event.prefixAll(member.name))
    },
    [onChange, member.name]
  )

  const inputProps = useMemo((): PrimitiveInputProps => {
    return {
      onBlur: handleBlur,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType,
      compareValue: member.field.compareValue,
      focusRef: focusRef,
      id: member.field.id,
      onFocus: handleFocus,
      path: member.field.path,
      focused: member.field.focused,
      onChange: handleChange,
    }
  }, [
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.compareValue,
    member.field.id,
    member.field.path,
    member.field.focused,
    handleBlur,
    handleFocus,
    handleChange,
  ])
  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): PrimitiveFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      children: renderedInput,
    }
  }, [
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.collapsible,
    member.collapsed,
    member.index,
    member.name,
    renderedInput,
  ])

  return <>{renderField(fieldProps)}</>
})
