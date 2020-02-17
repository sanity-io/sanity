import React from 'react'
import usePresence from 'part:@sanity/base/hooks/presence'

export default function FieldPresence(props) {
  const presence = usePresence(props.filter)
  return <div>{JSON.stringify(presence)}</div>
}
