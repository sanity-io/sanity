import React from 'react'

const style = {
  height: 'calc(100vh - 2rem)',
  position: 'absolute',
  padding: '1rem',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fafafa'
}

export default function (storyFn, story) { //eslint-disable-line react/display-name
  return <div style={style}>{storyFn()}</div>
}
