import {isHttpError} from '@sanity/client'

import {isPlainObject} from '../../util/isPlainObject'
import {AGENT_API_VERSION} from './generateQuery'

/** What reading the AI credits needs of a client; a `SanityClient` has it */
export interface AiCreditsClient {
  config: () => {projectId?: string; apiHost?: string}
  withConfig: (config: {apiVersion: string}) => {
    request: (options: {url: string; tag: string; signal?: AbortSignal}) => Promise<unknown>
  }
}

/**
 * The AI credits of the organization that owns the project, for the current month. Every
 * Agent Actions request is one credit, so these are what the Generate and Explain controls
 * spend.
 */
export interface AiCredits {
  /** Whether Agent Actions requests go through; false once the spending limit is reached */
  granted: boolean
  /** Why they do not, as the API names it (`plan_limit_reached`, `default_budget_limit_reached`) */
  reasonCode: string | undefined
  /** Credits used this month, as far as the API has metered them (it lags behind by hours) */
  used: number | undefined
  /** Credits the plan includes per month */
  quota: number | undefined
}

export const AI_CREDITS_DOCS_URL =
  'https://www.sanity.io/docs/platform-management/how-ai-credits-work'

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * The credits as the `ai-usage` resource of the project's subscription reports them; `undefined`
 * for a response of another shape, which is what a Studio talking to an API without it gets
 */
export function readAiCredits(response: unknown): AiCredits | undefined {
  if (!isPlainObject(response) || typeof response.granted !== 'boolean') return undefined
  const subscription = isPlainObject(response.subscription) ? response.subscription : {}
  const usage = isPlainObject(response.usage) ? response.usage : {}
  return {
    granted: response.granted,
    reasonCode: optionalString(response.reasonCode),
    used: optionalNumber(usage.value),
    quota: optionalNumber(subscription.quota),
  }
}

/**
 * Reads the organization's AI credits through the project. The resource only exists on the
 * experimental API, and a Studio talking to an API without it resolves with `undefined`, so
 * nothing depends on the answer.
 */
export async function fetchAiCredits(
  client: AiCreditsClient,
  signal?: AbortSignal,
): Promise<AiCredits | undefined> {
  const {projectId} = client.config()
  if (!projectId) return undefined
  const response = await client.withConfig({apiVersion: AGENT_API_VERSION}).request({
    url: `/subscriptions/project/${projectId}/resources/ai-usage`,
    tag: 'vista.ai-credits',
    signal,
  })
  return readAiCredits(response)
}

/**
 * The credits a request was turned down for, from the 429 response Agent Actions give once the
 * organization's spending limit is reached: its body names the limit and carries the usage and
 * the quota, which a plain rate limit response does not. `undefined` for any other error.
 */
export function readAiCreditsLimit(error: unknown): AiCredits | undefined {
  if (!isHttpError(error) || error.statusCode !== 429) return undefined
  const body = error.response.body
  if (!isPlainObject(body)) return undefined
  const reasonCode = optionalString(body.reasonCode)
  const quota = optionalNumber(body.quota)
  if (reasonCode === undefined && quota === undefined) return undefined
  return {granted: false, reasonCode, used: optionalNumber(body.usageValue), quota}
}

/**
 * The reason code of credits exhausted because the plan's monthly quota is used up, as opposed to
 * a spending limit the organization set itself (`default_budget_limit_reached`)
 */
const PLAN_LIMIT_REACHED = 'plan_limit_reached'

/**
 * Whether more AI credits come with a bigger plan: the credits are exhausted, and what exhausted
 * them is the plan's quota rather than a spending limit the organization chose. A limit for any
 * other reason, or for a reason the API leaves out, is raised in Manage instead.
 */
export function canUpsellAiCredits(credits: AiCredits): boolean {
  return !credits.granted && credits.reasonCode === PLAN_LIMIT_REACHED
}

/** The Sanity website the project's API host belongs to, for links into Manage */
function websiteUrl(apiHost: string | undefined): string {
  return apiHost?.endsWith('.work') ? 'https://www.sanity.work' : 'https://www.sanity.io'
}

/**
 * The organization's AI usage in Manage; without the organization ID, Manage's own redirect to
 * the organization of the signed-in user
 */
export function aiUsageUrl(apiHost: string | undefined, organizationId: string | null): string {
  const site = websiteUrl(apiHost)
  return organizationId
    ? `${site}/organizations/${organizationId}/usage/ai`
    : `${site}/manage/org/usage/ai`
}

/** The organization's spending limits in Manage, where the AI credits limit is raised */
export function aiSpendingLimitUrl(
  apiHost: string | undefined,
  organizationId: string | null,
): string {
  const site = websiteUrl(apiHost)
  return organizationId
    ? `${site}/organizations/${organizationId}/settings#caps`
    : `${site}/manage/org/settings`
}
