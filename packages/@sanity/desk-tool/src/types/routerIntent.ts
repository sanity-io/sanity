type JsonParams = {[key: string]: unknown}

type BaseRouterIntentParams = {
  type?: string
  id?: string
  template?: string
}

export type RouterIntentParams = BaseRouterIntentParams | [BaseRouterIntentParams, JsonParams]

export interface RouterIntent {
  type: string
  params?: RouterIntentParams
}
