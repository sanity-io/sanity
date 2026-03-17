import {defineEvent} from '@sanity/telemetry'

/** Fired when the AuthBoundary resolves from 'loading' to a final auth state. */
export const AuthBoundaryResolved = defineEvent<{
  durationMs: number
  result: 'logged-in' | 'logged-out' | 'unauthorized'
}>({
  name: 'Auth Boundary Resolved',
  version: 1,
  description: 'Time from AuthBoundary mount until auth state is resolved',
})
