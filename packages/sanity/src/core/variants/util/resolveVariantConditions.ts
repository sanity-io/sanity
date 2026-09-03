import {
  type VariantConditionMap,
  type VariantConditions,
  type VariantConditionsContext,
  type VariantConditionsFunctionRef,
} from '../../config/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {isRecord} from '../../util/isRecord'

/**
 * A `beta.variants.conditions` value that needs to be resolved before use:
 * a browser function or a reference to a deployed Sanity Function.
 *
 * @internal
 */
export type VariantConditionsSource = Exclude<VariantConditions, unknown[]>

/**
 * @internal
 */
export function isVariantConditionsFunctionRef(
  value: unknown,
): value is VariantConditionsFunctionRef {
  return isRecord(value) && typeof value.function === 'string'
}

async function invokeConditionsFunction(
  ref: VariantConditionsFunctionRef,
  context: VariantConditionsContext,
): Promise<VariantConditionMap[]> {
  const client = context.getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const result = await client.functions.invoke<VariantConditionMap[]>(
    ref.function,
    {
      event: {data: {projectId: context.projectId, dataset: context.dataset}},
      stackId: ref.stackId,
      organizationId: ref.organizationId,
      timeout: ref.timeout,
    },
    {sync: true},
  )

  if (!Array.isArray(result)) {
    throw new Error(
      `Expected function "${ref.function}" to return an array of variant conditions, but received ${
        result === null ? 'null' : typeof result
      }`,
    )
  }

  return result
}

/**
 * Runs a conditions source and returns the raw, not yet normalized, list.
 *
 * @internal
 */
export function resolveVariantConditions(
  source: VariantConditionsSource,
  context: VariantConditionsContext,
): Promise<VariantConditionMap[]> {
  if (isVariantConditionsFunctionRef(source)) {
    return invokeConditionsFunction(source, context)
  }

  return Promise.resolve().then(() => source(context))
}
