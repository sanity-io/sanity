import React from 'react'
import PatchEvent from '../../PatchEvent'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValueInput from '../InvalidValueInput'
import {ArrayType, ItemValue} from './typedefs'

interface Props {
  type: ArrayType
  value: unknown
  onChange: (event: PatchEvent, valueOverride?: ItemValue) => void
}

export default function InvalidItem({value, type, onChange}: Props) {
  const actualType = resolveTypeName(value)
  const validTypes = type.of.map(ofType => ofType.name)
  return (
    <InvalidValueInput
      actualType={actualType}
      validTypes={validTypes}
      onChange={onChange}
      value={value}
    />
  )
}
