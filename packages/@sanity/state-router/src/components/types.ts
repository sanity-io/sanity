import {PubSub} from 'nano-pubsub'

export type NavigateOptions = {
  replace?: boolean
}

export type IntentParameters = Record<string, any> | [Record<string, any>, Record<string, any>]

export type RouterState = Record<string, any>

export type InternalRouter = {
  resolvePathFromState: (nextState: RouterState) => string
  resolveIntentLink: (intentName: string, params?: IntentParameters) => string
  navigateUrl: (url: string, options?: NavigateOptions) => void
  navigate: (nextState: RouterState, options?: NavigateOptions) => void
  navigateIntent: (intentName: string, params?: IntentParameters, options?: NavigateOptions) => void
  getState: () => RouterState
  channel: PubSub<RouterState>
}

export type HOCRouter = {
  navigate: (nextState: Record<string, any>, options?: NavigateOptions) => void
  navigateIntent: (intentName: string, params?: IntentParameters, options?: NavigateOptions) => void
  state: Record<any, any>
}

export type RouterProviderContext = {
  __internalRouter: InternalRouter
}
