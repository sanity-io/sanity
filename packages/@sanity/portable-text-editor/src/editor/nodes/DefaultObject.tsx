import React from 'react'
import {PortableTextBlock, PortableTextChild} from '../../types/portableText'

type Props = {
  value: PortableTextBlock | PortableTextChild
}

const DefaultObject = (props: Props): JSX.Element => {
  return <pre>{JSON.stringify(props.value, null, 2)}</pre>
}

export default DefaultObject
