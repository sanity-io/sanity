import React from 'react'
import {Document as DefaultDocument} from '@sanity/base'

export default function Document(props) {
  const {entryPath, ...rest} = props
  return <DefaultDocument entryPath="/entry.tsx" {...rest} />
}
