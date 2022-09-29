import {isRecord} from '../util'

/** @internal */
export interface ConfigResolutionErrorOptions {
  name: string
  type: string
  causes: Array<ConfigResolutionError | Error | unknown>
}

/** @internal */
export class ConfigResolutionError extends Error {
  name: string
  type: string
  causes: unknown[]

  constructor({causes, name, type}: ConfigResolutionErrorOptions) {
    const messages = causes
      .filter(Boolean)
      .map((cause) =>
        isRecord(cause) && typeof cause?.message === 'string' ? cause.message : String(cause)
      )

    super(
      `Could not resolve ${type}${name ? ` \`${name}\`` : ''}:\n${messages
        .map((message) => `\t- ${message}`)
        .join('\n')}\n\n`
    )

    this.name = name
    this.causes = causes
    this.type = type
  }
}
