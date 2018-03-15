// @flow

export type NavigateOptions = {
  replace?: boolean
}

type Channel<T> = () => {
  subscribe: T => () => void,
  get(): T,
  publish(T): void
}

export type RouterState = Object

export type InternalRouter = {
  resolvePathFromState: (nextState: RouterState) => string,
  resolveIntentLink: (intentName: string, params?: Object) => string,
  navigateUrl: (url: string, options?: NavigateOptions) => void,
  navigate: (nextState: RouterState, options?: NavigateOptions) => void,
  navigateIntent: (intentName: string, params?: Object, options?: NavigateOptions) => void,
  getState: () => RouterState,
  channel: Channel<RouterState>
}

export type Router = {
  navigate: (nextState: Object, options?: NavigateOptions) => void,
  navigateIntent: (intentName: string, params?: Object, options?: NavigateOptions) => void,
  state: Object
}

export type RouterProviderContext = {
  __internalRouter: InternalRouter
}
