import React from 'react'

export default function Dump(props) {
  let serialized
  try {
    serialized = JSON.stringify(props, null, 2)
  } catch (err) {
    serialized = 'Unable to serialize props, logging to console'
    // eslint-disable-next-line no-console
    console.warn(props)
  }

  return <pre>{serialized}</pre>
}
