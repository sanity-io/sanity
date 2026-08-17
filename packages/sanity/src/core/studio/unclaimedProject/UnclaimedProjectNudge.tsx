import {ClockIcon} from '@sanity/icons/Clock'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
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
import {useUnclaimedProjectContext} from './UnclaimedProjectProvider'
import {ROBOT_PROVIDER, type UnclaimedProjectState} from './useUnclaimedProject'
import {useUnclaimedProjectClock} from './useUnclaimedProjectClock'
import {useUnclaimedProjectCopy} from './useUnclaimedProjectCopy'

/**
 * Persistent banner + snoozable toast nudging the user to claim a minted-but-unclaimed project
 * before it expires. Once claimed, the robot session is cleared and the user is sent directly
 * to login. Renders nothing after the claim period or for anything not part of mint-and-claim —
 * see {@link useUnclaimedProject}.
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
  const {onClaim, state} = useUnclaimedProjectContext()

  if (!state) return null

  return <UnclaimedProjectNudgeInner onClaim={onClaim} state={state} />
}

function UnclaimedProjectNudgeInner({
  onClaim,
  state,
}: {
  onClaim: () => void
  state: UnclaimedProjectState
}) {
  const {projectId} = useWorkspace()
  const copy = useUnclaimedProjectCopy(true)

  const unclaimed = state?.status === 'unclaimed' ? state : undefined
  const now = useUnclaimedProjectClock(Boolean(unclaimed), unclaimed?.expiresAt)
  const claimable = unclaimed && unclaimed.expiresAt.getTime() > now ? unclaimed : undefined
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
    claimable &&
    claimable.expiresAt.getTime() - now <= copy.criticalThresholdHours * 3_600_000,
  )

  // Dismissal happens through the snooze button: useConditionalToast re-pushes while enabled,
  // which would defeat a close control.
  useConditionalToast({
    id: 'unclaimed-project-nudge',
    status: critical ? 'error' : 'warning',
    enabled: Boolean(copy && claimable) && !isSnoozed,
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
    description: claimable && copy && (
      <Stack gap={4} paddingY={2}>
        <Text size={1} weight="regular">
          {claimable.claimUrl || claimable.claimLinkSpent
            ? copy.toast.description
            : copy.noClaimUrl.text}
        </Text>
        <Flex gap={3}>
          {claimable.claimUrl && (
            <Button
              as="a"
              href={claimable.claimUrl}
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

  if (!claimable) return null

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
        <UnclaimedProjectCountdown expiresAt={claimable.expiresAt} critical={critical} />
        {claimable.claimUrl ? (
          <Button
            as="a"
            href={claimable.claimUrl}
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
        ) : !claimable.claimLinkSpent ? (
          <Text size={1}>{copy.noClaimUrl.text}</Text>
        ) : null}
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
