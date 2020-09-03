import React from 'react'
import {UserColor} from '@sanity/base/user-color'
import {PreviewComponent} from '../../../preview/types'

type BooleanProps = {
  checked: boolean | undefined | null
  color: UserColor
}

const defaultColor = {
  background: '#fcc',
  text: '#f00',
  border: '#cad1dc'
}

export const BooleanPreview: PreviewComponent<boolean> = function BooleanPreview({
  value,
  schemaType,
  color
}) {
  const Preview = schemaType.options?.layout === 'checkbox' ? Checkbox : Switch
  return <Preview checked={value} color={color || defaultColor} />
}

export function Checkbox({checked, color}: BooleanProps) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      xmlns="http://www.w3.org/2000/svg"
      fill={color.background}
      stroke={color.border}
    >
      <rect x="0.5" y="0.5" width="16" height="16" rx="2.5" />
      {typeof checked === 'undefined' && (
        <path d="M4.07996 8.5H12.92" stroke={color.text} strokeWidth="2" />
      )}
      {checked && (
        <path
          d="M3.73999 8.49994L7.13999 11.8999L13.6 5.43994"
          stroke={color.text}
          strokeWidth="2"
        />
      )}
    </svg>
  )
}

export function Switch({checked}: BooleanProps) {
  return (
    <svg width="33" height="17" viewBox="0 0 33 17" xmlns="http://www.w3.org/2000/svg">
      <rect width="33" height="17" rx="8.5" fill={checked ? '#3AB667' : '#7B8CA8'} />
      {typeof checked === 'undefined' && (
        <rect x="12" y="4" width="9" height="9" rx="4.5" fill="white" />
      )}
      {checked && <rect x="20" y="4" width="9" height="9" rx="4.5" fill="white" />}
      {typeof checked === 'boolean' && !checked && (
        <rect x="4" y="4" width="9" height="9" rx="4.5" fill="white" />
      )}
    </svg>
  )
}
