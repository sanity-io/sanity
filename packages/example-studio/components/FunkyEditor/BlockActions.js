import React from 'react'

export default function renderBlockActions(block) {
  if (block._type === 'image') {
    return <div>Action!</div>
  }
  return null
}
