// @flow

import React from 'react'

type Props = {
  block: {_type: string}
}

export default function renderBlockActions(props: Props) {
  if (props.block._type === 'author') {
    return <div>Author!</div>
  }
  return null
}
