/* eslint-disable i18next/no-literal-string */
import {LaunchIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {type RequestErrorClaim} from './types'

/**
 * Things a user can check themselves when the studio can't reach the
 * Sanity API. Ordered most-likely-first.
 */
const NETWORK_TROUBLESHOOTING = [
  'Check that your device is online.',
  'Disable VPNs, ad blockers, or browser extensions that may block requests.',
  'Check status.sanity.io for ongoing incidents.',
]

function NetworkTroubleshooting() {
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="medium">
          Troubleshooting
        </Text>
        <Stack as="ul" space={2} style={{margin: 0, paddingLeft: '1.25em'}}>
          {NETWORK_TROUBLESHOOTING.map((tip) => (
            <Box as="li" key={tip}>
              <Text size={1} muted>
                {tip}
              </Text>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

/**
 * Ticks down from `claim.retryAfterSeconds` to 0, once per second.
 * Resets whenever a new claim object arrives — a retried request that
 * gets rate-limited again produces a fresh claim, and the countdown must
 * restart from the new Retry-After rather than staying at 0 with an
 * enabled button.
 *
 * @internal
 */
export function useRetryCountdown(claim: {retryAfterSeconds?: number}): number {
  const [secondsLeft, setSecondsLeft] = useState(claim.retryAfterSeconds ?? 0)

  useEffect(() => {
    const initial = claim.retryAfterSeconds ?? 0
    // Reset the countdown when a new claim arrives (a re-rate-limited retry
    // produces a fresh claim with a new Retry-After). Intentional derived-state
    // sync driven by the external claim, not a render cascade.
    // oxlint-disable-next-line react/react-compiler
    setSecondsLeft(initial)
    if (initial <= 0) return undefined
    const id = setInterval(() => {
      setSecondsLeft((current) => {
        const next = Math.max(0, current - 1)
        if (next === 0) clearInterval(id)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [claim])

  return secondsLeft
}

/**
 * Studio dialog for claimed request errors (network / 5xx / 429).
 *
 * Button policy is driven by the caller's `retryable` assertion — the
 * call site knows whether re-running its request is safe; the studio
 * doesn't guess:
 *  - `retryable: true` → "Try again" re-runs the parked request(s),
 *    plus "Reload Studio" as an escape hatch.
 *  - `retryable: false` → only "Reload Studio", with conservative copy
 *    warning that the last change may not have been applied.
 *  - 429 additionally gates "Try again" behind a live Retry-After
 *    countdown.
 *
 * @internal
 */
export function RequestErrorDialog(props: {
  claim: Exclude<RequestErrorClaim, {type: 'unauthorized'}>
  onRetry: () => void
}) {
  const {claim, onRetry} = props

  if (claim.type === 'rateLimited') {
    return <RateLimitedDialog claim={claim} onRetry={onRetry} />
  }

  const heading = claim.type === 'serverError' ? 'Server error' : 'Network error'

  const message =
    claim.type === 'serverError'
      ? claim.retryable
        ? "The server ran into an issue and couldn't complete the request. You can try again, or reload the Studio."
        : "The server ran into an issue and couldn't complete the request. Your last change may not have been saved. Reload the Studio to see the current state."
      : claim.retryable
        ? "Couldn't reach the Sanity servers. Check your network connection and try again."
        : "Couldn't reach the Sanity servers. Your last change may not have been sent. Check your network connection and reload the Studio to see the current state."

  return (
    <Dialog
      id="request-error-dialog"
      header={heading}
      width={1}
      footer={
        claim.retryable
          ? {
              cancelButton: {
                text: 'Reload Studio',
                onClick: () => window.location.reload(),
                tone: 'default',
              },
              confirmButton: {
                text: 'Try again',
                onClick: onRetry,
                tone: 'default',
              },
            }
          : {
              confirmButton: {
                text: 'Reload Studio',
                onClick: () => window.location.reload(),
                tone: 'default',
              },
            }
      }
    >
      <Stack space={4}>
        <Text>{message}</Text>
        {claim.type === 'networkError' ? <NetworkTroubleshooting /> : null}
        {claim.type === 'serverError' ? (
          <Text size={1}>
            <a
              href="https://status.sanity.io"
              rel="noopener noreferrer"
              style={{color: 'var(--card-link-fg-color)'}}
              target="_blank"
            >
              <Flex as="span" align="center" gap={2}>
                <span>Check Sanity Status</span>
                <LaunchIcon />
              </Flex>
            </a>
          </Text>
        ) : null}
      </Stack>
    </Dialog>
  )
}

function RateLimitedDialog(props: {
  claim: {type: 'rateLimited'; error: Error; retryAfterSeconds?: number; retryable: boolean}
  onRetry: () => void
}) {
  const {claim, onRetry} = props
  const secondsLeft = useRetryCountdown(claim)

  // Disable the button while a retry is in flight. The dialog stays
  // mounted until the retried request settles (success clears the claim;
  // another 429 produces a new claim object), so "new claim object" is
  // the signal that the in-flight retry concluded.
  const [retrying, setRetrying] = useState(false)
  useEffect(() => {
    // A new claim object means the in-flight retry concluded — clear the
    // disabled state. Intentional sync to the external claim, not a cascade.
    // oxlint-disable-next-line react/react-compiler
    setRetrying(false)
  }, [claim])
  const handleRetry = useCallback(() => {
    setRetrying(true)
    onRetry()
  }, [onRetry])

  if (!claim.retryable) {
    return (
      <Dialog
        id="request-error-dialog"
        header="Too many requests"
        width={1}
        footer={{
          confirmButton: {
            text: 'Reload Studio',
            onClick: () => window.location.reload(),
            tone: 'default',
          },
        }}
      >
        <Stack space={4}>
          <Text>Too many requests at once. Reload the Studio to try again.</Text>
        </Stack>
      </Dialog>
    )
  }

  return (
    <Dialog
      id="request-error-dialog"
      header="Too many requests"
      width={1}
      footer={{
        confirmButton: {
          text: retrying
            ? 'Retrying…'
            : secondsLeft > 0
              ? `Try again (${secondsLeft})`
              : 'Try again',
          onClick: handleRetry,
          disabled: secondsLeft > 0 || retrying,
          tone: 'default',
          // Use tabular numerals so per-digit width variance doesn't make
          // the button reflow as the countdown ticks. Inter (the Studio
          // font) ships tabular-nums OpenType variants.
          style: {fontVariantNumeric: 'tabular-nums'},
        },
      }}
    >
      <Stack space={4}>
        <Text>Too many requests at once. You can try again shortly.</Text>
      </Stack>
    </Dialog>
  )
}
