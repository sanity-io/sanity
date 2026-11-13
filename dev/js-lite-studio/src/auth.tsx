/**
 * Authentication, compatible with the JS studio's: the same token storage key and format, so
 * signing in to either studio signs in to all of them, plus `token` / `sid` in the URL hash or
 * query. The same flow as the Rust studio's `auth.rs`.
 */
import {type SanityClient} from '@sanity/client'
import {CodeIcon} from '@sanity/icons/Code'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {LeaveIcon} from '@sanity/icons/Leave'
import {LockIcon} from '@sanity/icons/Lock'
import {Button, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {client, makeClient, statusCode} from './client'
import {API_HOST, API_VERSION, PROJECT_ID, TOKEN_KEY, WORKSPACE} from './config'
import {forgetReplica} from './replica'
import {storageGet, storageRemove, storageSet} from './util'

export interface User {
  id: string
  name: string
  email?: string
  image?: string
}

export function userFromJson(value: unknown): User | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string') return undefined
  return {
    id: record.id,
    name: typeof record.name === 'string' ? record.name : 'Unknown user',
    email: typeof record.email === 'string' ? record.email : undefined,
    image: typeof record.profileImage === 'string' ? record.profileImage : undefined,
  }
}

/** The first letters of the first and last names, like the JS studio's `UserAvatar`. */
export function initials(name: string): string {
  const names = name
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
  const first = names[0]?.[0] ?? ''
  const last = names.length > 1 ? (names[names.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

export interface Provider {
  name: string
  title: string
  url: string
}

export type AuthState =
  | {type: 'checking'}
  | {type: 'loggedOut'; providers: Provider[]; loginUrls: string[]}
  | {type: 'loggedIn'; user: User}
  | {type: 'unauthorized'; user: User}
  | {type: 'failed'; message: string}

function signedIn(user: unknown): AuthState | undefined {
  const parsed = userFromJson(user)
  if (!parsed) return undefined
  const roles = (user as {roles?: unknown}).roles
  const hasRole = Array.isArray(roles) && roles.length > 0
  return hasRole ? {type: 'loggedIn', user: parsed} : {type: 'unauthorized', user: parsed}
}

function storedToken(): string | undefined {
  const raw = storageGet(TOKEN_KEY)
  if (!raw) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && 'token' in parsed
      ? String((parsed as {token: unknown}).token)
      : undefined
  } catch {
    return raw
  }
}

function storeToken(token: string): void {
  storageSet(TOKEN_KEY, JSON.stringify({token, time: new Date().toISOString()}))
}

/** URL parameters that carry credentials. A login callback hands over `#sid=`. */
const CREDENTIAL_PARAMS = ['sid', 'token', 'url']

function urlParams(part: string): URLSearchParams {
  return new URLSearchParams(part.replace(/^[#?]/, ''))
}

/** Removes the credentials from the URL so they do not end up in history or screenshots. */
function stripCredentials(): void {
  const without = (part: string, prefix: string) => {
    const params = urlParams(part)
    for (const name of CREDENTIAL_PARAMS) params.delete(name)
    const rest = params.toString()
    return rest ? `${prefix}${rest}` : ''
  }
  const {pathname, search, hash} = window.location
  history.replaceState(null, '', `${pathname}${without(search, '?')}${without(hash, '#')}`)
}

function credential(name: string): string | undefined {
  for (const part of [window.location.hash, window.location.search]) {
    const value = urlParams(part).get(name)
    if (value) return value
  }
  return undefined
}

async function currentUser(candidate: SanityClient): Promise<unknown> {
  try {
    const user = await candidate.request({url: '/users/me', tag: 'users.get-current'})
    return typeof user === 'object' && user !== null && 'id' in user ? user : undefined
  } catch (error) {
    if (statusCode(error) === 401) return undefined
    throw error
  }
}

function loginUrl(providerUrl: string, origin: string): string {
  const url = new URL(providerUrl)
  url.searchParams.set('origin', origin)
  url.searchParams.set('projectId', PROJECT_ID)
  // `type=token` would hand the session id back in the query, which reaches server logs.
  url.searchParams.set('withSid', 'true')
  return url.href
}

/**
 * Resolves the session and returns the client to use for it: with a bearer token, or with the
 * session cookie when there is no token but the cookie is valid.
 */
export async function authenticate(): Promise<[SanityClient, AuthState]> {
  const base = makeClient(undefined)
  const token = credential('token')
  const sid = credential('sid')
  if (token) {
    storeToken(token)
    stripCredentials()
  } else if (sid) {
    stripCredentials()
    try {
      const response = await fetch(
        `https://${PROJECT_ID}.${API_HOST}/v${API_VERSION}/auth/fetch?sid=${encodeURIComponent(sid)}`,
        {credentials: 'omit'},
      )
      const body = (await response.json()) as {token?: string}
      if (!response.ok || !body.token) throw new Error(`HTTP ${response.status}`)
      storeToken(body.token)
    } catch (error) {
      return [base, {type: 'failed', message: `Could not complete the login: ${String(error)}`}]
    }
  }

  const stored = storedToken()
  if (stored) {
    const withToken = makeClient(stored)
    try {
      const user = await currentUser(withToken)
      const state = user ? signedIn(user) : undefined
      if (state) return [withToken, state]
      storageRemove(TOKEN_KEY)
    } catch (error) {
      return [withToken, {type: 'failed', message: String(error)}]
    }
  }

  try {
    const user = await currentUser(base)
    const state = user ? signedIn(user) : undefined
    if (state) return [base, state]
  } catch {
    // Falls through to the login screen
  }

  try {
    const response = await base.request<{providers?: Provider[]}>({url: '/auth/providers'})
    const providers = (response.providers ?? []).filter(
      (provider) => provider.url && provider.title,
    )
    const origin = `${window.location.origin}${window.location.pathname}${window.location.search}`
    return [
      base,
      {
        type: 'loggedOut',
        providers,
        loginUrls: providers.map((provider) => loginUrl(provider.url, origin)),
      },
    ]
  } catch (error) {
    return [base, {type: 'failed', message: String(error)}]
  }
}

/**
 * Ends the token session and the cookie session, since requests with a token carry no cookies
 * and `authenticate` falls back to the cookie once the token is gone.
 */
export async function logout(): Promise<void> {
  const current = client()
  if (current.config().token) {
    await current.request({url: '/auth/logout', method: 'POST'}).catch(() => undefined)
  }
  await makeClient(undefined)
    .request({url: '/auth/logout', method: 'POST'})
    .catch(() => undefined)
  storageRemove(TOKEN_KEY)
  // The next user of this browser must not see what this one could read.
  await forgetReplica()
  window.location.reload()
}

function providerIcon(name: string) {
  switch (name) {
    case 'github':
      return CodeIcon
    case 'google':
      return EarthGlobeIcon
    case 'sanity':
      return EnvelopeIcon
    default:
      return LockIcon
  }
}

export function LoginScreen(props: {providers: Provider[]; loginUrls: string[]}) {
  const {providers, loginUrls} = props
  return (
    <Flex align="center" justify="center" height="fill" padding={4}>
      <Card radius={3} shadow={1} padding={4} style={{width: 360, maxWidth: '100%'}}>
        <Stack gap={4}>
          <Stack gap={3}>
            <Heading size={1}>Choose login provider</Heading>
            <Text size={1} muted>
              Signing in here also signs you in to the JS studio.
            </Text>
          </Stack>
          <Stack gap={2}>
            {providers.map((provider, index) => {
              const Icon = providerIcon(provider.name)
              return (
                <Card
                  key={provider.name}
                  as="a"
                  href={loginUrls[index]}
                  radius={2}
                  border
                  padding={3}
                >
                  <Flex align="center" gap={3}>
                    <Text size={1}>
                      <Icon />
                    </Text>
                    <Text size={1} weight="medium">
                      {provider.title}
                    </Text>
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      </Card>
    </Flex>
  )
}

export function UnauthorizedScreen(props: {user: User}) {
  const {user} = props
  const [signingOut, setSigningOut] = useState(false)
  const account = user.email
    ? `You are signed in as ${user.name} (${user.email}),`
    : `You are signed in as ${user.name},`
  return (
    <Flex align="center" justify="center" height="fill" padding={4}>
      <Card radius={3} shadow={1} padding={4} style={{width: 400, maxWidth: '100%'}}>
        <Stack gap={4}>
          <Stack gap={3}>
            <Heading size={1}>You don&apos;t have access to this project</Heading>
            <Text size={1} muted>
              {account} but that account has no role on project <code>{PROJECT_ID}</code>. Ask an
              administrator to invite you, or request access from the JS studio.
            </Text>
          </Stack>
          <Flex gap={2} justify="flex-end">
            <Button mode="ghost" text="Request access" as="a" href={`/${WORKSPACE}`} />
            <Button
              tone="primary"
              icon={LeaveIcon}
              text="Sign out"
              loading={signingOut}
              onClick={() => {
                setSigningOut(true)
                void logout()
              }}
            />
          </Flex>
        </Stack>
      </Card>
    </Flex>
  )
}
