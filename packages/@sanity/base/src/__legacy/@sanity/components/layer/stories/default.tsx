import {Layer, LayerProvider, useLayer} from '@sanity/ui'
import React, {useCallback, useState} from 'react'

export function DefaultStory() {
  return (
    <LayerProvider>
      <Example />
    </LayerProvider>
  )
}

function Example() {
  const layer = useLayer()
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <div>
      <h1>Layer example</h1>
      <pre>
        zOffset={layer.zIndex}, size={layer.size}
      </pre>
      <button onClick={handleOpen} type="button">
        Open
      </button>
      {open && (
        <Layer style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Layer1 onClose={handleClose} />
        </Layer>
      )}
    </div>
  )
}

function Layer1({onClose}: {onClose: () => void}) {
  const layer = useLayer()
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <div style={{background: '#fff', boxShadow: '0 5px 10px rgba(0, 0, 0, 0.25)', padding: 16}}>
      <div style={{display: 'flex'}}>
        <div style={{flex: 1}}>
          <strong>Layer</strong>
        </div>
        <button onClick={onClose} type="button">
          &times;
        </button>
      </div>
      <pre>
        zOffset={layer.zIndex}, size={layer.size}
      </pre>
      <button onClick={handleOpen} type="button">
        Open
      </button>
      {open && (
        <Layer style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Layer2 onClose={handleClose} />
        </Layer>
      )}
    </div>
  )
}

function Layer2({onClose}: {onClose: () => void}) {
  const layer = useLayer()

  return (
    <div style={{background: '#fff', boxShadow: '0 5px 10px rgba(0, 0, 0, 0.25)', padding: 16}}>
      <div style={{display: 'flex'}}>
        <div style={{flex: 1}}>
          <strong>Layer</strong>
        </div>
        <button onClick={onClose} type="button">
          &times;
        </button>
      </div>
      <pre>
        zOffset={layer.zIndex}, size={layer.size}
      </pre>
    </div>
  )
}
