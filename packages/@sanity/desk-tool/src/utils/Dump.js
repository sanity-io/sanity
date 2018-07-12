import React from 'react'

export default function Dump(props) {
  return <pre>{JSON.stringify(props, null, 2)}</pre>
}
