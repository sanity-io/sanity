import type {SourceClientOptions} from './config'

/**
 * Unless otherwise specified, this is the API version we use for controlled
 * requests on internal studio APIs. The user should always ask for a specific
 * API version when using the client - this way we can upgrade which version we
 * use internally without having the users code break unexpectedly. It also
 * means the user can easily upgrade to newer versions of GROQ when it arrives.
 *
 * @internal
 */
export const DEFAULT_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  apiVersion: '2022-09-09',
}
