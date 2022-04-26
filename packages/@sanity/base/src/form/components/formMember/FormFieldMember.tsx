import React from 'react'
import {ArrayMember, FieldMember, ObjectMember} from '../../types'
import {FormNode, useFormNode} from '../formNode'

/**
 * A utility component for rendering an object field.
 *
 * @alpha
 */
export function FormFieldMember(props: {name: string}) {
  const {members} = useFormNode()
  const {name} = props
  const fieldMembers = members?.filter(isObjectFieldMember)
  const fieldMember = fieldMembers?.find((member) => member.field.name === name)

  if (!fieldMember) {
    return null
  }

  return <FormNode fieldProps={fieldMember.field} />
}

function isObjectFieldMember(member: ObjectMember | ArrayMember): member is FieldMember {
  return member.type === 'field'
}
