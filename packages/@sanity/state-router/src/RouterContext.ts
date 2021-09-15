import React from 'react'
import {InternalRouter} from './components/types'

const missingContext = () => {
  throw new Error('No router context provider found')
}

export const RouterContext = React.createContext<InternalRouter>({
  channel: {subscribe: missingContext, publish: missingContext},
  getState: missingContext,
  navigate: missingContext,
  navigateIntent: missingContext,
  navigateUrl: missingContext,
  resolveIntentLink: missingContext,
  resolvePathFromState: missingContext,
})
