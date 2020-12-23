import React from 'react'
import {ArraySchemaType} from '@sanity/types'
import PatchEvent from '../../PatchEvent'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValueInput from '../InvalidValueInput'
import {ArrayMember} from './types'

interface Props {
  type: ArraySchemaType
  value: unknown
  onChange: (event: PatchEvent, valueOverride?: ArrayMember) => void
}

export default function InvalidItem({value, type, onChange}: Props) {
  const actualType = resolveTypeName(value)
  const validTypes = type.of.map((ofType) => ofType.name)
  return (
    <InvalidValueInput
      actualType={actualType}
      validTypes={validTypes}
      onChange={onChange}
      value={value}
    />
  )
}
