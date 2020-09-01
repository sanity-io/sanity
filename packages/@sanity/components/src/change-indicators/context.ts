import React from 'react'
interface ChangeIndicatorContext {
  isChanged: boolean
}

const initial: ChangeIndicatorContext = {isChanged: false}

export const Context: React.Context<ChangeIndicatorContext> = React.createContext(initial)
export const Provider = Context.Provider
