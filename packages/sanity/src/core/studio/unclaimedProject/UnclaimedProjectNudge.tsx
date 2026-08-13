import {ClockIcon} from '@sanity/icons/Clock'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {startTransition, useCallback, useEffect, useState} from 'react'
import {Box} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {isDev} from '../../environment'
import {useConditionalToast} from '../../hooks/useConditionalToast'
import {useDateTimeFormat} from '../../hooks/useDateTimeFormat'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {
  clearUnclaimedProjectRecord,
  readUnclaimedProjectSnoozedAt,
  writeUnclaimedProjectSnoozedAt,
} from '../../store/authStore/unclaimedProjectStorage'
import {interpolateTemplate} from '../../util/interpolateTemplate'
import {useWorkspace} from '../workspace'
import {
  ROBOT_PROVIDER,
  type UnclaimedProjectState,
  useUnclaimedProject,
} from './useUnclaimedProject'
import {
  getClaimedIdentityText,
  getClaimedIdentityTextParts,
  useUnclaimedProjectCopy,
} from './useUnclaimedProjectCopy'

/**
 * Persistent banner + snoozable toast nudging the user to claim a minted-but-unclaimed project
 * before it expires, flipping to an identity-aware login banner once it's claimed. Renders
 * nothing for anything not part of mint-and-claim — see {@link useUnclaimedProject}.
 *
 * @internal
 */
export function UnclaimedProjectNudge() {
  if (!isDev) return null

  return <UnclaimedProjectNudgeAuthCheck />
}

function UnclaimedProjectNudgeAuthCheck() {
  const {currentUser, projectId} = useWorkspace()
  const provider = currentUser?.provider

  useEffect(() => {
    if (provider && provider !== ROBOT_PROVIDER) clearUnclaimedProjectRecord(projectId)
  }, [projectId, provider])

  if (provider !== ROBOT_PROVIDER) return null

  return <UnclaimedProjectNudgeStateCheck />
}

function UnclaimedProjectNudgeStateCheck() {
  const {projectId} = useWorkspace()
  const [claimAttempt, setClaimAttempt] = useState<{projectId: string; startedAt: number}>()
  const claimAttemptedAt =
    claimAttempt?.projectId === projectId ? claimAttempt.startedAt : undefined
  const state = useUnclaimedProject({claimAttemptedAt})
  const handleClaim = useCallback(
    () => setClaimAttempt({projectId, startedAt: Date.now()}),
    [projectId],
  )

  if (!state) return null

  return <UnclaimedProjectNudgeInner onClaim={handleClaim} state={state} />
}

function UnclaimedProjectNudgeInner({
  onClaim,
  state,
}: {
  onClaim: () => void
  state: UnclaimedProjectState
}) {
  const {auth, projectId} = useWorkspace()
  const copy = useUnclaimedProjectCopy(true)

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

  // The claim URL is spent; keep its provenance while the robot token is active so this banner
  // survives refreshes. Clear it together with the token so a fresh session lands on login.
  const handleSignIn = useCallback(() => {
    clearUnclaimedProjectRecord(projectId)
    void auth.logout?.()
  }, [auth, projectId])

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
      <Stack gap={4} paddingY={2}>
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
              iconRight={
                <LaunchIcon
                  aria-hidden="true"
                  data-testid="unclaimed-project-launch-icon"
                  focusable="false"
                />
              }
              text={copy.toast.claimButtonText}
              onClick={onClaim}
            />
          )}
          <Button
            mode="bleed"
            tone="neutral"
            size="default"
            paddingY={1}
            text={copy.toast.snoozeButtonText}
            onClick={handleSnooze}
            style={{fontSize: '0.6875rem'}}
          />
        </Flex>
      </Stack>
    ),
  })

  if (!copy) return null

  if (state?.status === 'claimed') {
    return (
      <Card data-testid="unclaimed-project-banner" tone="positive" padding={3} borderBottom>
        <Box display={['block', 'block', 'none']}>
          <Stack gap={3}>
            <Flex align="center" gap={3} justify="space-between">
              <Text size={1} weight="medium" style={{flex: 1, minWidth: 0}}>
                {copy.claimed.text}
              </Text>
              <Button
                mode="default"
                tone="positive"
                size="default"
                text={copy.claimed.signInButtonText}
                onClick={handleSignIn}
                style={{flexShrink: 0}}
              />
            </Flex>
            <Text size={1} weight="medium" style={{overflowWrap: 'anywhere'}}>
              <ClaimedIdentityText text={copy.claimed.identityText} email={state.email} />
            </Text>
          </Stack>
        </Box>
        <Box display={['none', 'none', 'block']}>
          <Flex align="center" gap={3} justify="center" wrap="wrap">
            <Text size={1} weight="medium" style={{overflowWrap: 'anywhere'}}>
              {copy.claimed.text}{' '}
              <ClaimedIdentityText text={copy.claimed.identityText} email={state.email} />
            </Text>
            <Button
              mode="default"
              tone="positive"
              size="default"
              text={copy.claimed.signInButtonText}
              onClick={handleSignIn}
            />
          </Flex>
        </Box>
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
            iconRight={
              <LaunchIcon
                aria-hidden="true"
                data-testid="unclaimed-project-launch-icon"
                focusable="false"
              />
            }
            text={copy.banner.claimButtonText}
            onClick={onClaim}
          />
        ) : unclaimed.claimLinkSpent ? null : (
          <Text size={1}>{copy.noClaimUrl.text}</Text>
        )}
      </Flex>
    </Card>
  )
}

function ClaimedIdentityText({text, email}: {text: string; email?: string}) {
  const parts = getClaimedIdentityTextParts(text, email)

  return parts ? (
    <>
      {parts.before}
      <strong>{parts.identity}</strong>
      {parts.after}
    </>
  ) : (
    getClaimedIdentityText(text, email)
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
