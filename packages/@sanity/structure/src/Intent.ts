export interface Intent {
  type: string
  params?: {type?: string; id?: string}
}

export interface IntentChecker {
  (intentName: string, params?: {[key: string]: any}): boolean
  identity?: Symbol
}
