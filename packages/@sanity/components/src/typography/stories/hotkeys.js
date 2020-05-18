import React from 'react'
import Hotkeys from '../Hotkeys'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

export function HotkeysStory() {
  return (
    <div style={centerStyle}>
      <Hotkeys keys={['Ctrl', 'Alt', 'T']} />
    </div>
  )
}
