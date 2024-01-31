import {PortableTextObject} from '@sanity/types'
import React from 'react'
import {useCallbackWithTryCatch} from '../hooks/useCallbackWithTryCatch'

type Props = {
  annotation: PortableTextObject
  children: React.ReactNode
}
export function DefaultAnnotation(props: Props) {
  const handleClick = useCallbackWithTryCatch(
    // eslint-disable-next-line no-alert
    () => alert(JSON.stringify(props.annotation)),
    [props.annotation],
    'DefaultAnnotation:handleClick',
  )
  return (
    <span style={{color: 'blue'}} onClick={handleClick}>
      {props.children}
    </span>
  )
}
