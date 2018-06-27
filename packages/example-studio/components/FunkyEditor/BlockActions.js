// @flow

import React from 'react'

export default function renderBlockActions(block: {_type: string}) {
  if (block._type === 'image') {
    return <div>Action!</div>
  }
  return null
}
