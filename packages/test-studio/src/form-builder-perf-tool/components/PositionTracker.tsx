import React from 'react'
import {omit} from 'lodash'
import shallowEquals from 'shallow-equals'

export const Context = React.createContext({
  dispatch: event => {}
})

export const PositionTracker = React.memo(function PositionTracker(props) {
  const [positions, dispatch] = React.useReducer((prevState, event) => {
    if (event.type === 'update' || event.type === 'update') {
      if (prevState[event.key] && shallowEquals(prevState[event.key].rect, event.rect)) {
        return prevState
      }
      return {...prevState, [event.key]: {key: event.key, rect: event.rect}}
    }
    if (event.type === 'unmount') {
      return omit(prevState, event.key)
    }
  }, {})

  return (
    <Context.Provider value={{dispatch}}>
      {Object.keys(positions)
        .map(pos => positions[pos])
        .map(pos => (
          <div
            title={pos.key}
            key={pos.key}
            style={{
              outline: '1px solid red',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              position: 'fixed',
              ...pos.rect
            }}
          ></div>
        ))}
      {props.children}
    </Context.Provider>
  )
})
