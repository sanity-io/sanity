import React from 'react'
type Props = {
  value: string | boolean | number
}
export function PreviewPrimitive(props: Props) {
  return <span>{props.value}</span>
}
