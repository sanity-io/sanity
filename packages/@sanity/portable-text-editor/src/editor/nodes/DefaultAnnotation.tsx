import React, {useCallback} from 'react'
import {PortableTextBlock} from '../../types/portableText'

type Props = {
  annotation: PortableTextBlock
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
