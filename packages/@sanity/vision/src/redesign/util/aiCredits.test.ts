import {ClientError} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {
  aiSpendingLimitUrl,
  aiUsageUrl,
  fetchAiCredits,
  readAiCredits,
  readAiCreditsLimit,
} from './aiCredits'

/** What the project's `ai-usage` subscription resource answers */
const usage = {
  granted: true,
  reasonCode: null,
  reasonText: null,
  subscription: {
    resourceId: 'ai-usage',
    quota: 1000,
    overageAllowed: false,
    overageChunkPrice: 0.05,
  },
  usage: {
    metric: 'ai-usage',
    value: 58,
    periodStart: '2026-10-01T00:00:00Z',
    periodEnd: '2026-11-01T00:00:00Z',
  },
}

describe('readAiCredits', () => {
  it('reads the credits from the ai-usage resource', () => {
    expect(readAiCredits(usage)).toEqual({
      granted: true,
      reasonCode: undefined,
      used: 58,
      quota: 1000,
    })
  })

  it('reads why requests are turned down', () => {
    expect(
      readAiCredits({
        ...usage,
        granted: false,
        reasonCode: 'plan_limit_reached',
        usage: {...usage.usage, value: 1000},
      }),
    ).toEqual({granted: false, reasonCode: 'plan_limit_reached', used: 1000, quota: 1000})
  })

  it('leaves out a quota the subscription does not state', () => {
    expect(readAiCredits({...usage, subscription: {...usage.subscription, quota: null}})).toEqual({
      granted: true,
      reasonCode: undefined,
      used: 58,
      quota: undefined,
    })
  })

  it('has nothing for a response of another shape', () => {
    expect(readAiCredits(undefined)).toBeUndefined()
    expect(readAiCredits('granted')).toBeUndefined()
    expect(readAiCredits({granted: 'yes'})).toBeUndefined()
    expect(readAiCredits({usage: {value: 3}})).toBeUndefined()
  })
})

describe('fetchAiCredits', () => {
  function createClient(config: {projectId?: string}) {
    const request = vi.fn(() => Promise.resolve<unknown>(usage))
    const withConfig = vi.fn(() => ({request}))
    return {client: {config: () => config, withConfig}, request, withConfig}
  }

  it('reads the resource of the project on the experimental API', async () => {
    const {client, request, withConfig} = createClient({projectId: 'abc'})
    const {signal} = new AbortController()
    await expect(fetchAiCredits(client, signal)).resolves.toEqual({
      granted: true,
      reasonCode: undefined,
      used: 58,
      quota: 1000,
    })
    expect(withConfig).toHaveBeenCalledWith({apiVersion: 'vX'})
    expect(request).toHaveBeenCalledWith({
      url: '/subscriptions/project/abc/resources/ai-usage',
      tag: 'vision.ai-credits',
      signal,
    })
  })

  it('has nothing to read without a project', async () => {
    const {client, request} = createClient({})
    await expect(fetchAiCredits(client)).resolves.toBeUndefined()
    expect(request).not.toHaveBeenCalled()
  })
})

describe('readAiCreditsLimit', () => {
  function response(statusCode: number, body: unknown): ClientError {
    return new ClientError({
      statusCode,
      statusMessage: 'Too Many Requests',
      headers: {},
      body,
      url: 'https://abc.api.sanity.io/vX/agent/action/prompt',
      method: 'POST',
    })
  }

  it('reads the credits from the response that turned a request down for them', () => {
    expect(
      readAiCreditsLimit(
        response(429, {
          statusCode: 429,
          error: 'MeteringLimitReached',
          message: 'The organization has used all its AI credits',
          reasonCode: 'default_budget_limit_reached',
          usageValue: 100,
          quota: 100,
        }),
      ),
    ).toEqual({granted: false, reasonCode: 'default_budget_limit_reached', used: 100, quota: 100})
  })

  it('tells a plain rate limit apart', () => {
    expect(
      readAiCreditsLimit(
        response(429, {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        }),
      ),
    ).toBeUndefined()
  })

  it('has nothing for other failures', () => {
    expect(
      readAiCreditsLimit(response(403, {reasonCode: 'plan_limit_reached', quota: 100})),
    ).toBeUndefined()
    expect(readAiCreditsLimit(new Error('Network error'))).toBeUndefined()
    expect(readAiCreditsLimit(undefined)).toBeUndefined()
  })
})

describe('the links into Manage', () => {
  it('point at the organization, on the website of the API host', () => {
    expect(aiUsageUrl('https://api.sanity.io', 'org-1')).toBe(
      'https://www.sanity.io/organizations/org-1/usage/ai',
    )
    expect(aiSpendingLimitUrl('https://api.sanity.io', 'org-1')).toBe(
      'https://www.sanity.io/organizations/org-1/settings#caps',
    )
    expect(aiUsageUrl('https://api.sanity.work', 'org-1')).toBe(
      'https://www.sanity.work/organizations/org-1/usage/ai',
    )
  })

  it('leave finding the organization to Manage while it is not known', () => {
    expect(aiUsageUrl(undefined, null)).toBe('https://www.sanity.io/manage/org/usage/ai')
    expect(aiSpendingLimitUrl(undefined, null)).toBe('https://www.sanity.io/manage/org/settings')
  })
})
