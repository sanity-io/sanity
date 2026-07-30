import {ClockIcon} from '@sanity/icons/Clock'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {startTransition, useCallback, useEffect, useState} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useConditionalToast} from '../../hooks/useConditionalToast'
import {useDateTimeFormat} from '../../hooks/useDateTimeFormat'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {
  readUnclaimedProjectSnoozedAt,
  writeUnclaimedProjectSnoozedAt,
} from '../../store/authStore/unclaimedProjectStorage'
import {interpolateTemplate} from '../../util/interpolateTemplate'
import {useWorkspace} from '../workspace'
import {useUnclaimedProject} from './useUnclaimedProject'
import {useUnclaimedProjectCopy} from './useUnclaimedProjectCopy'

/**
 * Persistent banner + snoozable toast nudging the user to claim a minted-but-unclaimed project
 * before it expires, flipping to a "sign in as yourself" banner once it's claimed. Renders
 * nothing for anything not part of mint-and-claim — see {@link useUnclaimedProject}.
 *
 * @internal
 */
export function UnclaimedProjectNudge() {
  const state = useUnclaimedProject()
  const copy = useUnclaimedProjectCopy(Boolean(state))
  const {auth, projectId} = useWorkspace()

  const unclaimed = state?.status === 'unclaimed' ? state : undefined
  const now = useMinuteTick(Boolean(unclaimed))
  const timeLeft = useRelativeTime(unclaimed?.expiresAt ?? '')
  const expiresAtFormatter = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const expiresAt = unclaimed ? expiresAtFormatter.format(unclaimed.expiresAt) : ''
  const templateValues = {expiresAt, timeLeft}

  const [snoozeState, setSnoozeState] = useState(() => ({
    projectId,
    snoozedAt: readUnclaimedProjectSnoozedAt(projectId),
  }))
  const snoozedAt =
    snoozeState.projectId === projectId
      ? snoozeState.snoozedAt
      : readUnclaimedProjectSnoozedAt(projectId)
  const handleSnooze = useCallback(() => {
    const at = new Date().toISOString()
    writeUnclaimedProjectSnoozedAt(projectId, at)
    setSnoozeState({projectId, snoozedAt: at})
  }, [projectId])
  const snoozeDurationMs = (copy?.snoozeMinutes ?? 0) * 60_000
  const isSnoozed = Boolean(
    snoozedAt && snoozeDurationMs && now - new Date(snoozedAt).getTime() < snoozeDurationMs,
  )

  const critical = Boolean(
    copy &&
    unclaimed &&
    unclaimed.expiresAt.getTime() - now <= copy.criticalThresholdHours * 3_600_000,
  )

  // The claim URL is spent; the robot token still works, so the token is cleared through this
  // CTA rather than automatically — a fresh session lands on the login screen.
  const handleSignIn = useCallback(() => void auth.logout?.(), [auth])

  // Dismissal happens through the snooze button: useConditionalToast re-pushes while enabled,
  // which would defeat a close control.
  useConditionalToast({
    id: 'unclaimed-project-nudge',
    status: critical ? 'error' : 'warning',
    enabled: Boolean(copy && unclaimed) && !isSnoozed,
    title: copy ? (
      <strong>
        {interpolateTemplate(
          critical ? copy.toast.criticalTitle : copy.toast.title,
          templateValues,
        )}
      </strong>
    ) : (
      ''
    ),
    description: unclaimed && copy && (
      <Stack space={4} paddingY={2}>
        <Text size={1} weight="regular">
          {unclaimed.claimUrl || unclaimed.claimLinkSpent
            ? copy.toast.description
            : copy.noClaimUrl.text}
        </Text>
        <Flex gap={3}>
          {unclaimed.claimUrl && (
            <Button
              as="a"
              href={unclaimed.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              mode="default"
              tone={critical ? 'critical' : 'primary'}
              size="default"
              iconRight={LaunchIcon}
              text={copy.toast.claimButtonText}
            />
          )}
          <Button
            mode="bleed"
            tone="neutral"
            size="default"
            paddingY={1}
            text={copy.toast.snoozeButtonText}
            onClick={handleSnooze}
            style={{fontSize: '0.6875rem', opacity: 0.6}}
          />
        </Flex>
      </Stack>
    ),
  })

  // One final farewell, pushed once so dismissing it sticks — unlike useConditionalToast,
  // which re-pushes for as long as its condition holds.
  const toast = useToast()
  const expired = state?.status === 'expired'
  useEffect(() => {
    if (!expired || !copy) return
    toast.push({
      id: 'unclaimed-project-expired',
      status: 'warning',
      closable: true,
      duration: Infinity,
      title: copy.expired.toastTitle,
    })
  }, [copy, expired, toast])

  if (!copy) return null

  if (state?.status === 'claimed') {
    return (
      <Card data-testid="unclaimed-project-banner" tone="positive" padding={3} borderBottom>
        <Flex align="center" gap={3} justify="center" wrap="wrap">
          <Text size={1} weight="medium">
            {copy.claimed.text}
          </Text>
          <Button
            mode="default"
            tone="positive"
            size="default"
            text={copy.claimed.signInButtonText}
            onClick={handleSignIn}
          />
        </Flex>
      </Card>
    )
  }

  if (!unclaimed) return null

  return (
    <Card
      data-testid="unclaimed-project-banner"
      tone={critical ? 'critical' : 'caution'}
      padding={3}
      borderBottom
    >
      <Flex align="center" gap={3} justify="center" wrap="wrap">
        <Flex align="center" gap={2}>
          <Flex aria-hidden="true" align="center" justify="center" style={{lineHeight: 0}}>
            <ClockIcon style={{display: 'block'}} />
          </Flex>
          <Text size={1} weight="medium">
            {interpolateTemplate(
              critical ? copy.banner.criticalText : copy.banner.text,
              templateValues,
            )}
          </Text>
        </Flex>
        <UnclaimedProjectCountdown expiresAt={unclaimed.expiresAt} critical={critical} />
        {unclaimed.claimUrl ? (
          <Button
            as="a"
            href={unclaimed.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            mode="default"
            tone={critical ? 'critical' : 'primary'}
            size="default"
            iconRight={LaunchIcon}
            text={copy.banner.claimButtonText}
          />
        ) : unclaimed.claimLinkSpent ? null : (
          <Text size={1}>{copy.noClaimUrl.text}</Text>
        )}
      </Flex>
    </Card>
  )
}

/** Isolates the per-second update so the full nudge does not re-render on every tick. */
export function UnclaimedProjectCountdown({
  critical,
  expiresAt,
}: {
  critical: boolean
  expiresAt: Date
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Badge
      aria-hidden="true"
      data-testid="unclaimed-project-countdown"
      fontSize={1}
      mode="outline"
      padding={2}
      radius={2}
      tone={critical ? 'critical' : 'caution'}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.08em',
        minWidth: '7.5ch',
        textAlign: 'center',
      }}
    >
      {formatCountdown(expiresAt, now)}
    </Badge>
  )
}

/** Formats the remaining expiry window without locale-specific unit labels. */
export function formatCountdown(expiresAt: Date, now: number): string {
  const totalSeconds = Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1_000))
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

/** Re-evaluates the snooze window and the critical flip once a minute while the nudge shows. */
function useMinuteTick(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return undefined
    // Refresh right away — the interval alone would serve a clock up to a minute stale after a
    // stretch with the nudge hidden.
    startTransition(() => setNow(Date.now()))
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [enabled])
  return now
}
