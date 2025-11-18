import {useCallback, useMemo, useRef} from 'react'

import {type FieldMember, type InternalFormDecoratorFormNode} from '../../../store'
import {useDocumentFieldActions} from '../../../studio/contexts/DocumentFieldActions'
import {useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {
  type ComplexElementProps,
  type InternalFormDecoratorFieldProps,
  type InternalFormDecoratorInputProps,
  type RenderFieldCallback,
  type RenderInputCallback,
} from '../../../types'
import {createDescriptionId} from '../../common/createDescriptionId'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for a primitive field/input
 * @param props - Component props
 *
 * @internal
 */
export function DecorationField(props: {
  member: FieldMember<InternalFormDecoratorFormNode>
  renderInput: RenderInputCallback<InternalFormDecoratorInputProps>
  renderField: RenderFieldCallback<InternalFormDecoratorFieldProps>
}) {
  const {member, renderInput, renderField} = props

  const fieldActions = useDocumentFieldActions()

  const focusRef = useRef<{focus: () => void}>(undefined)

  const {onPathBlur, onPathFocus} = useFormCallbacks()

  const handleBlur = useCallback(() => {
    onPathBlur(member.field.path)
  }, [member.field.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.field.path)
  }, [member.field.path, onPathFocus])

  const elementProps = useMemo(
    (): ComplexElementProps => ({
      'onBlur': handleBlur,
      'onFocus': handleFocus,
      'id': member.field.id,
      'ref': focusRef,
      'aria-describedby': createDescriptionId(member.field.id, member.field.schemaType.description),
    }),
    [handleBlur, handleFocus, member.field.id, member.field.schemaType],
  )

  const inputProps = useMemo((): Omit<InternalFormDecoratorInputProps, 'renderDefault'> => {
    return {
      value: member.field.value as any,
      compareValue: member.field.compareValue,
      __unstable_computeDiff: member.field.__unstable_computeDiff,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType as any,
      changed: member.field.changed,
      hasUpstreamVersion: member.field.hasUpstreamVersion,
      id: member.field.id,
      path: member.field.path,
      focused: member.field.focused,
      level: member.field.level,
      validation: member.field.validation,
      presence: member.field.presence,
      elementProps,
      displayInlineChanges: member.field.displayInlineChanges ?? false,
    }
  }, [
    member.field.displayInlineChanges,
    member.field.value,
    member.field.compareValue,
    member.field.__unstable_computeDiff,
    member.field.readOnly,
    member.field.schemaType,
    member.field.changed,
    member.field.hasUpstreamVersion,
    member.field.id,
    member.field.path,
    member.field.focused,
    member.field.level,
    member.field.validation,
    member.field.presence,
    elementProps,
  ])

  return (
    <RenderField
      actions={fieldActions}
      changed={member.field.changed}
      description={member.field.schemaType.description}
      index={member.index}
      inputId={member.field.id}
      inputProps={inputProps as any}
      level={member.field.level}
      name={member.name}
      path={member.field.path}
      presence={member.field.presence}
      schemaType={member.field.schemaType as any}
      title={member.field.schemaType.title}
      validation={member.field.validation}
      value={member.field.value as any}
      render={renderField}
    >
      <RenderInput {...inputProps} render={renderInput} />
    </RenderField>
  )
}

// The RenderInput and RenderField wrappers workaround the strict refs checks in React Compiler
function RenderInput({
  render,
  ...props
}: Omit<InternalFormDecoratorInputProps, 'renderDefault'> & {
  render: RenderInputCallback<InternalFormDecoratorInputProps>
}) {
  return render(props)
}
function RenderField({
  render,
  ...props
}: Omit<InternalFormDecoratorFieldProps, 'renderDefault'> & {
  render: RenderFieldCallback<InternalFormDecoratorFieldProps>
}) {
  return render(props)
}
