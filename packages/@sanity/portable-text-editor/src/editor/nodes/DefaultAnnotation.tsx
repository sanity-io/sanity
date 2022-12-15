import {PortableTextObject} from '@sanity/types'
import React, {useCallback} from 'react'

type Props = {
  annotation: PortableTextObject
  children: React.ReactNode
}
export function DefaultAnnotation(props: Props) {
  // eslint-disable-next-line no-alert
  const handleClick = useCallback(() => alert(JSON.stringify(props.annotation)), [props.annotation])
  return (
    <span style={{color: 'blue'}} onClick={handleClick}>
      {props.children}
    </span>
  )
}
