// @flow

export type NavigateOptions = {
  replace?: boolean
}

export type InternalRouter = {
  resolvePathFromState: (nextState : Object) => string,
  resolveIntentLink: (intent : string, params? : Object) => string,
  navigateUrl: (url : string, options? : NavigateOptions) => void
}

export type ContextRouter = {
  navigate: (nextState : Object, options? : NavigateOptions) => void,
  state: Object
}


export type RouterProviderContext = {
  __internalRouter: InternalRouter,
  router: ContextRouter,
}

