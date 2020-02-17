import React from 'react'

export default function WithPresence({presence, children}) {
  // console.log(presence)
  return (
    <div style={{border: '1px solid red'}}>
      {JSON.stringify(presence)}
      {children}
    </div>
  )
}
