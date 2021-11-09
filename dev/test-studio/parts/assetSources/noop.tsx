import React from 'react'

export default {
  name: 'noop-asset-source',
  title: 'Noop asset source',
  component: NoopAssetSource,
}

function NoopAssetSource(props) {
  return (
    <div>
      This is a noop asset source that doesn't do anything meaningful{' '}
      <button type="button" onClick={props.onClose}>
        Ok
      </button>
    </div>
  )
}
