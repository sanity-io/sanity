import React from 'react'

interface Props {
  onClose: () => void
}

export default {
  name: 'noop-asset-source',
  title: 'Noop asset source',
  component: React.forwardRef<HTMLDivElement, Props>(function NoopAssetSource(props, ref) {
    return (
      <div ref={ref}>
        This is a noop asset source that doesn't do anything meaningful{' '}
        <button type="button" onClick={props.onClose}>
          Ok
        </button>
      </div>
    )
  }),
}
