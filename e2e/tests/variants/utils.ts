import {type SanityClient} from '@sanity/client'

// Variant actions are only routable on a newer API version than the shared e2e
// client default (2021-08-31). This matches VARIANTS_STUDIO_CLIENT_OPTIONS.
const VARIANTS_API_VERSION = 'X'

export function getVariantsClient(sanityClient: SanityClient): SanityClient {
  return sanityClient.withConfig({apiVersion: VARIANTS_API_VERSION})
}

export function isVariantNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false

  const err = error as {
    statusCode?: unknown
    response?: {statusCode?: unknown}
    message?: unknown
  }

  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.response?.statusCode === 'number'
        ? err.response.statusCode
        : undefined

  return (
    statusCode === 404 || (typeof err.message === 'string' && err.message.includes('was not found'))
  )
}

async function ignoreVariantNotFound(action: () => Promise<unknown>): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (!isVariantNotFoundError(error)) {
      throw error
    }
  }
}

export async function createVariantDefinition(
  sanityClient: SanityClient,
  options: {
    variantId: string
    conditions?: Record<string, string>
    priority?: number
    metadata?: {title?: string; [key: string]: unknown}
  },
): Promise<void> {
  // Variant definition actions are available at runtime, but their payloads are
  // not yet typed on SanityClient.action(). Remove `as never` once
  // @sanity/client exports these action types.
  await getVariantsClient(sanityClient).action({
    actionType: 'sanity.action.variant.definition.create',
    variantId: options.variantId,
    conditions: options.conditions ?? {},
    priority: options.priority ?? 0,
    metadata: options.metadata,
  } as never)
}

export async function createVariantDocument(
  sanityClient: SanityClient,
  options: {
    variantId: string
    publishedId: string
    document: {_type: string; title: string}
    bundleId?: string
  },
): Promise<void> {
  await getVariantsClient(sanityClient).action({
    actionType: 'sanity.action.document.variant.create',
    variantId: options.variantId,
    publishedId: options.publishedId,
    document: options.document,
    ...(options.bundleId ? {bundleId: options.bundleId} : {}),
  } as never)
}

export async function deleteVariantDocument(
  sanityClient: SanityClient,
  options: {
    variantId: string
    publishedId: string
    bundleId?: string
  },
): Promise<void> {
  await getVariantsClient(sanityClient).action({
    actionType: 'sanity.action.document.variant.delete',
    publishedId: options.publishedId,
    variantId: options.variantId,
    ...(options.bundleId ? {bundleId: options.bundleId} : {}),
  } as never)
}

export async function deleteVariantDefinition(
  sanityClient: SanityClient,
  variantId: string,
  options?: {publishedId?: string},
): Promise<void> {
  const publishedId = options?.publishedId
  if (publishedId) {
    await ignoreVariantNotFound(() =>
      deleteVariantDocument(sanityClient, {
        variantId,
        publishedId,
      }),
    )
  }

  await ignoreVariantNotFound(() =>
    getVariantsClient(sanityClient).action({
      actionType: 'sanity.action.variant.definition.delete',
      variantId,
    } as never),
  )
}
