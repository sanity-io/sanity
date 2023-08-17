import React, {useCallback} from 'react'
import {Box} from '@sanity/ui'
import {FieldError} from '../../store/types/memberErrors'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {PatchEvent} from '../../patch'
import {InvalidValueInput} from '../../inputs/InvalidValueInput'
import {MissingKeysAlert} from './errors/MissingKeysAlert'
import {DuplicateKeysAlert} from './errors/DuplicateKeysAlert'
import {MixedArrayAlert} from './errors/MixedArrayAlert'

/** @internal */
export function MemberFieldError(props: {member: FieldError}) {
  const {member} = props
  const {onChange} = useFormCallbacks()

  const handleChange = useCallback(
    (event: PatchEvent) => {
      onChange(PatchEvent.from(event).prefixAll(member.fieldName))
    },
    [onChange, member.fieldName],
  )
  if (member.error.type === 'INCOMPATIBLE_TYPE') {
    return (
      <InvalidValueInput
        value={member.error.value}
        onChange={handleChange}
        actualType={member.error.resolvedValueType}
        validTypes={[member.error.expectedSchemaType.name]}
      />
    )
  }
  if (member.error.type === 'MISSING_KEYS') {
    return <MissingKeysAlert error={member.error} onChange={handleChange} />
  }
  if (member.error.type === 'DUPLICATE_KEYS') {
    return <DuplicateKeysAlert error={member.error} onChange={handleChange} />
  }
  if (member.error.type === 'MIXED_ARRAY') {
    return <MixedArrayAlert onChange={handleChange} error={member.error} />
  }
  return <Box>Unexpected error: {props.member.error.type}</Box>
}
