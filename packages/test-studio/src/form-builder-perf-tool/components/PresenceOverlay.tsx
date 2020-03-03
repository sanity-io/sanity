import React from 'react'

export const Context = React.createContext({
  theme: 'dark',
  toggleTheme: () => {}
})

export function PresenceOverlay(props) {
  return (
    <div>
      <div></div>
      {props.children}
    </div>
  )
}
