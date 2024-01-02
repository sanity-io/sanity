import {RouterPaneSiblingContext} from '../types'

export interface PaneResolutionErrorOptions {
  message: string
  context?: RouterPaneSiblingContext
  helpId?: string
  cause?: Error
}

/**
 * An error thrown during pane resolving. This error is meant to be bubbled up
 * through react and handled in an error boundary. It includes a `cause`
 * property which is the original error caught
 */
export class PaneResolutionError extends Error {
  cause: Error | undefined
  context: RouterPaneSiblingContext | undefined
  helpId: string | undefined

  constructor({message, context, helpId, cause}: PaneResolutionErrorOptions) {
    super(message)
    this.context = context
    this.helpId = helpId
    this.cause = cause
  }
}
