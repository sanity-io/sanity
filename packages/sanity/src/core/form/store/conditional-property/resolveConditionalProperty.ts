import {type SanityClient} from '@sanity/client'
import {
  type AsyncConditionalProperty,
  type ConditionalProperty,
  type CurrentUser,
  type Path,
} from '@sanity/types'

import {isRecord} from '../../../util'

/**
 * @internal
 */
export interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: Record<string, unknown>
  currentUser: Omit<CurrentUser, 'role'> | null
  value: unknown
  path: Path
  getClient: (options: {apiVersion: string}) => SanityClient
}

export const missingConditionalPropertyGetClient: ConditionalPropertyCallbackContext['getClient'] =
  () => {
    throw new Error('`getClient` is not available in this conditional property context')
  }

export interface ConditionalPropertyState {
  value: boolean
  isPending: boolean
  promise?: Promise<boolean>
}

export interface ResolveConditionalPropertyStateOptions {
  checkPropertyName: string
  pendingValue: boolean
}

function isThenable(value: unknown): value is Promise<unknown> {
  return isRecord(value) && typeof value.then === 'function'
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * @internal
 */
export function resolveConditionalPropertyState(
  property: AsyncConditionalProperty | ConditionalProperty,
  context: ConditionalPropertyCallbackContext,
  options: ResolveConditionalPropertyStateOptions,
): ConditionalPropertyState {
  const {
    currentUser,
    document,
    parent,
    value,
    path,
    getClient = missingConditionalPropertyGetClient,
  } = context

  if (typeof property === 'boolean' || property === undefined) {
    return {
      value: Boolean(property),
      isPending: false,
    }
  }

  try {
    const result = property({
      document: document as any,
      parent,
      value,
      currentUser,
      path,
      getClient,
    })

    if (isThenable(result)) {
      return {
        value: options.pendingValue,
        isPending: true,
        promise: result
          .then((resolvedValue) => {
            return  resolvedValue
          })
          .catch((error) => {
            console.error(
              `An error occurred while running the callback from \`${options.checkPropertyName}\`: ${getErrorMessage(error)}`,
            )
            return false
          }),
      }
    }

    if (typeof result === 'undefined') {
      console.warn(
        `The \`${options.checkPropertyName}\` option is or returned \`undefined\`. \`${options.checkPropertyName}\` should return a boolean.`,
      )
    }

    return {
      value:  result,
      isPending: false,
    }
  } catch (error) {
    console.error(
      `An error occurred while running the callback from \`${options.checkPropertyName}\`: ${getErrorMessage(error)}`,
    )

    return {
      value: false,
      isPending: false,
    }
  }
}

/**
 * @internal
 */
export function resolveConditionalProperty(
  property: AsyncConditionalProperty | ConditionalProperty,
  context: ConditionalPropertyCallbackContext,
) {
  return resolveConditionalPropertyState(property, context, {
    checkPropertyName: 'conditionalProperty',
    pendingValue: false,
  }).value
}
