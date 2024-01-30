import {PortableTextObject} from '@sanity/types'
import React from 'react'
import {useCallbackWithTelemetry} from '../../__telemetry__/useCallbackWithTelemetry'

type Props = {
  annotation: PortableTextObject
  children: React.ReactNode
}
export function DefaultAnnotation(props: Props) {
  const handleClick = useCallbackWithTelemetry(
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
