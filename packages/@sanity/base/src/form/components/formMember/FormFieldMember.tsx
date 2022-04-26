import React from 'react'
import {ArrayMember, FieldMember, InputProps, ObjectMember} from '../../types'
import {FormNode, useFormNode} from '../formNode'

/**
 * A utility component for rendering an object field.
 *
 * @alpha
 */
export function FormFieldMember(props: {
  component?: React.ComponentType<InputProps>
  name: string
}) {
  const {members} = useFormNode()
  const {component, name} = props
  const fieldMembers = members?.filter(isObjectFieldMember)
  const fieldMember = fieldMembers?.find((member) => member.field.name === name)

  if (!fieldMember) {
    return null
  }

  return <FormNode component={component} fieldProps={fieldMember.field} />
}

function isObjectFieldMember(member: ObjectMember | ArrayMember): member is FieldMember {
  return member.type === 'field'
}
