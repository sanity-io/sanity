import React from 'react'
import {UserColor} from '../../../../user-color'
import {FieldPreviewComponent} from '../../../preview'

type BooleanProps = {
  checked: boolean | undefined | null
  color?: UserColor
}

export const BooleanPreview: FieldPreviewComponent<boolean> = function BooleanPreview({
  value,
  schemaType,
  color,
}) {
  const Preview = schemaType.options?.layout === 'checkbox' ? Checkbox : Switch
  return <Preview checked={value} color={color} />
}

export function Checkbox({checked, color}: BooleanProps) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      xmlns="http://www.w3.org/2000/svg"
      fill={color?.background}
    >
      <rect x="0" y="0" width="17" height="17" rx="2.5" />
      {typeof checked === 'undefined' && (
        <path d="M4.07996 8.5H12.92" stroke={color?.text} strokeWidth="2" />
      )}
      {checked && <path d="M3.5 8L7 11.5L13.5 5" stroke={color?.text} strokeWidth="2" />}
    </svg>
  )
}

export function Switch({checked, color}: BooleanProps) {
  return (
    <svg width="38" height="22" viewBox="0 0 38 22" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="22" rx="11" fill={checked ? color?.border : color?.background} />
      {typeof checked === 'undefined' && (
        <rect x="11" y="3" width="16" height="16" rx="8" fill="white" />
      )}
      {checked && <rect x="18" y="3" width="16" height="16" rx="8" fill="white" />}
      {typeof checked === 'boolean' && !checked && (
        <rect x="4" y="3" width="16" height="16" rx="8" fill="white" />
      )}
    </svg>
  )
}
