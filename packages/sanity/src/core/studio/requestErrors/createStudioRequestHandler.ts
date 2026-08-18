import {type RequestHandler, type SanityClient} from '@sanity/client'

import {type RequestFailureDiagnostics} from '../../store/authStore/createAuthStore'
import {isInvalidSessionError} from './classify'
import {type RequestErrorChannel} from './types'

interface StudioRequestHandlerOptions {
  channel: RequestErrorChannel
  diagnostics?: RequestFailureDiagnostics
  getClient?: () => SanityClient
  waitForCorsRetry?: () => Promise<void>
}

/**
 * Handles the request failures that prevent the Studio itself from operating:
 * invalid sessions, invalid project or dataset configuration, and CORS
 * misconfiguration. All other failures remain the caller's responsibility.
 *
 * @internal
 */
export function createStudioRequestHandler({
  channel,
  diagnostics,
  getClient,
  waitForCorsRetry,
}: StudioRequestHandlerOptions): RequestHandler {
  return (request, next) => {
    const execute = async (): Promise<unknown> => {
      try {
        return await next(request)
      } catch (error) {
        if (isInvalidSessionError(error)) {
          return channel.handle(error)
        }

        if (diagnostics && getClient) {
          const client = getClient()
          const result = await diagnostics.diagnose(error, client)
          if (result.type !== 'unknown') {
            diagnostics.onRequestFailure(result, client)
            if (result.type === 'cors' && waitForCorsRetry) {
              await waitForCorsRetry()
              return execute()
            }
            return new Promise<never>(() => {})
          }
        }

        throw error
      }
    }

    return execute()
  }
}
