// @flow

import React from 'react'

export default function renderBlockActions(block: {_type: string}) {
  if (block._type === 'author') {
    return <div>Author!</div>
  }
  return null
}
