import {describe, expect, it} from 'vitest'

import {
  fetchAccessRequestStatus,
  listMyAccessRequests,
  submitAccessRequest,
} from '../accessRequests'
import {type SubmitAccessRequestResult} from '../types'
import {createApiError, createClientStub} from './testUtils'

describe('listMyAccessRequests', () => {
  it('returns an empty array when the API responds with null', async () => {
    const client = createClientStub({list: () => Promise.resolve(null)})
    await expect(listMyAccessRequests(client)).resolves.toEqual([])
  })
})

const submit = (client: ReturnType<typeof createClientStub>) =>
  submitAccessRequest({
    client,
    resourceType: 'project',
    resourceId: 'project-a',
    note: 'hi',
  })

describe('submitAccessRequest', () => {
  it('posts to the resource requests endpoint and returns the created request', async () => {
    const created = {id: 'req-1', status: 'pending'}
    const client = createClientStub({submit: () => Promise.resolve(created)})

    await expect(submit(client)).resolves.toEqual({
      type: 'submitted',
      request: created,
    })
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/access/project/project-a/requests',
        method: 'post',
        body: expect.objectContaining({note: 'hi', type: 'access'}),
      }),
    )
  })

  const errorCases: {
    given: string
    error: Error
    expected: SubmitAccessRequestResult
  }[] = [
    {
      given: '403 with the saml_enforcement_required code',
      error: createApiError(403, {
        code: 'saml_enforcement_required',
        message: 'SAML login is required for this organization',
        redirectUrl: 'https://idp.example.com/login',
      }),
      expected: {
        type: 'sso-enforced',
        redirectUrl: 'https://idp.example.com/login',
        message: 'SAML login is required for this organization',
      },
    },
    {
      given: '429 over the request limit',
      error: createApiError(429, {message: 'Too many'}),
      expected: {type: 'over-limit', message: 'Too many'},
    },
    {
      given: '409 for a blocked email domain',
      error: createApiError(409, {
        message: 'This email domain is not allowed',
      }),
      expected: {
        type: 'email-domain-blocked',
        message: 'This email domain is not allowed',
      },
    },
    {
      given: '409 when requests are disabled for the organization',
      error: createApiError(409, {
        message: 'Request Access feature is disabled for organization',
      }),
      expected: {
        type: 'requests-disabled',
        message: 'Request Access feature is disabled for organization',
      },
    },
    {
      given: '409 for a prior denial, stripping the Conflict prefix',
      error: createApiError(409, {
        message: 'Conflict - request already declined',
      }),
      expected: {type: 'denied', message: 'request already declined'},
    },
  ]

  it.each(errorCases)('maps $given → $expected.type', async ({error, expected}) => {
    const client = createClientStub({submit: () => Promise.reject(error)})
    await expect(submit(client)).resolves.toEqual(expected)
  })

  it.each([
    {
      given: 'a plain 403 without the SSO code',
      error: createApiError(403, {message: 'Forbidden'}),
    },
    {given: 'a network failure', error: new Error('network down')},
  ])('passes $given through as error', async ({error}) => {
    const client = createClientStub({submit: () => Promise.reject(error)})
    await expect(submit(client)).resolves.toEqual({type: 'error', error})
  })
})

const fetchStatus = (client: ReturnType<typeof createClientStub>, origin?: string) =>
  fetchAccessRequestStatus({
    client,
    resourceType: 'project',
    resourceId: 'project-a',
    origin,
  })

describe('fetchAccessRequestStatus', () => {
  it('gets the request-state endpoint for the resource', async () => {
    const client = createClientStub()

    await expect(fetchStatus(client)).resolves.toEqual({state: 'eligible'})
    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({url: '/access/project/project-a/requests/state'}),
    )
  })

  it('returns the saml-required verdict with its SSO login URL', async () => {
    const verdict = {
      state: 'saml-required',
      redirectUrl: 'https://www.sanity.io/login/sso/acme?origin=https%3A%2F%2Fexample.test%2F',
    }
    const client = createClientStub({status: () => Promise.resolve(verdict)})

    await expect(fetchStatus(client)).resolves.toEqual(verdict)
  })

  it('packs the origin as an opaque q param so the user returns after SSO', async () => {
    const client = createClientStub()

    await fetchStatus(client, 'https://example.test/resource')

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({query: {q: 'origin=https%3A%2F%2Fexample.test%2Fresource'}}),
    )
  })

  it('sends no query when there is no origin', async () => {
    const client = createClientStub()

    await fetchStatus(client)

    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({query: undefined}))
  })

  it.each([
    {given: 'the endpoint is missing', error: createApiError(404, {})},
    {given: 'the request fails', error: new Error('network down')},
  ])('fails open when $given, leaving the submit-time gate as the backstop', async ({error}) => {
    const client = createClientStub({status: () => Promise.reject(error)})

    await expect(fetchStatus(client)).resolves.toEqual({state: 'eligible'})
  })

  it('treats a null body as eligible', async () => {
    const client = createClientStub({status: () => Promise.resolve(null)})

    await expect(fetchStatus(client)).resolves.toEqual({state: 'eligible'})
  })
})
