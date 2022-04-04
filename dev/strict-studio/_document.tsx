import React from 'react'
import {DefaultDocument} from 'sanity'

export default function Document(props) {
  const {entryPath, ...rest} = props
  return <DefaultDocument entryPath="/entry.tsx" {...rest} />
}
