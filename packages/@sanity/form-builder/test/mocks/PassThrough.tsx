import React from 'react'
export default function PassThrough(props: any) {
  return props.children || <div />
}
