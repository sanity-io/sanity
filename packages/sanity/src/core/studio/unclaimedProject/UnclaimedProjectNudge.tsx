import {ClockIcon} from '@sanity/icons/Clock'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {startTransition, useCallback, useEffect, useState} from 'react'

import {Button} from '../../../ui-components'
import {useConditionalToast, useRelativeTime} from '../../hooks'
import {Translate, useTranslation} from '../../i18n'
import {
  readUnclaimedProjectSnoozedAt,
  writeUnclaimedProjectSnoozedAt,
} from '../../store/authStore/unclaimedProjectStorage'
import {useWorkspace} from '../workspace'
import {useUnclaimedProject} from './useUnclaimedProject'

/** Dismissing the toast buys this much quiet before it nudges again. */
const SNOOZE_DURATION_MS = 30 * 60_000

/** Below this long left, the nudge escalates from caution to critical. */
const CRITICAL_THRESHOLD_MS = 8 * 3_600_000

/**
 * Persistent banner + snoozable toast nudging the user to claim a minted-but-unclaimed project
 * before it expires, flipping to a "sign in as yourself" banner once it's claimed. Renders
 * nothing for anything not part of mint-and-claim — see {@link useUnclaimedProject}.
 *
 * @internal
 */
export function UnclaimedProjectNudge() {
  const state = useUnclaimedProject()
  const {auth, projectId} = useWorkspace()
  const {t} = useTranslation()

  const unclaimed = state?.status === 'unclaimed' ? state : undefined
  const now = useMinuteTick(Boolean(unclaimed))
  const expiry = useRelativeTime(unclaimed?.expiresAt ?? '', {useTemporalPhrase: true})

  const [snoozedAt, setSnoozedAt] = useState(() => readUnclaimedProjectSnoozedAt(projectId))
  const [snoozeProject, setSnoozeProject] = useState(projectId)
  if (snoozeProject !== projectId) {
    setSnoozeProject(projectId)
    setSnoozedAt(readUnclaimedProjectSnoozedAt(projectId))
  }
  const handleSnooze = useCallback(() => {
    const at = new Date().toISOString()
    writeUnclaimedProjectSnoozedAt(projectId, at)
    setSnoozedAt(at)
  }, [projectId])
  const isSnoozed = Boolean(snoozedAt && now - new Date(snoozedAt).getTime() < SNOOZE_DURATION_MS)

  const critical = Boolean(
    unclaimed && unclaimed.expiresAt.getTime() - now <= CRITICAL_THRESHOLD_MS,
  )

  // The claim URL is spent; the robot token still works, so the token is cleared through this
  // CTA rather than automatically — a fresh session lands on the login screen.
  const handleSignIn = useCallback(() => void auth.logout?.(), [auth])

  // Dismissal happens through the snooze button: useConditionalToast re-pushes while enabled,
  // which would defeat a close control.
  useConditionalToast({
    id: 'unclaimed-project-nudge',
    status: critical ? 'error' : 'warning',
    enabled: Boolean(unclaimed) && !isSnoozed,
    title: t(
      critical ? 'unclaimed-project.toast.critical.title' : 'unclaimed-project.toast.title',
      {expiry},
    ),
    description: unclaimed && (
      <Stack space={4} paddingY={1}>
        <Text size={1}>
          {unclaimed.claimUrl || unclaimed.claimLinkSpent ? (
            t('unclaimed-project.toast.description')
          ) : (
            <Translate t={t} i18nKey="unclaimed-project.no-claim-url.text" />
          )}
        </Text>
        <Flex gap={3}>
          {unclaimed.claimUrl && (
            <Button
              as="a"
              href={unclaimed.claimUrl}
              target="_blank"
              rel="noopener noreferrer"
              mode="ghost"
              tone="primary"
              size="default"
              icon={LaunchIcon}
              text={t('unclaimed-project.toast.claim-button.text')}
            />
          )}
          <Button
            mode="bleed"
            tone="neutral"
            size="default"
            text={t('unclaimed-project.toast.snooze-button.text')}
            onClick={handleSnooze}
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
    if (!expired) return
    toast.push({
      id: 'unclaimed-project-expired',
      status: 'warning',
      closable: true,
      duration: Infinity,
      title: t('unclaimed-project.expired.toast.title'),
    })
  }, [expired, t, toast])

  if (state?.status === 'claimed') {
    return (
      <Card data-testid="unclaimed-project-banner" tone="positive" padding={3} borderBottom>
        <Flex align="center" gap={3} justify="center" wrap="wrap">
          <Text size={1} weight="medium">
            {t('unclaimed-project.claimed.text')}
          </Text>
          <Button
            mode="default"
            tone="positive"
            size="default"
            text={t('unclaimed-project.claimed.sign-in-button.text')}
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
        <Text size={1} weight="medium">
          <ClockIcon style={{verticalAlign: 'text-bottom', marginRight: '0.5em'}} />
          {t(
            critical ? 'unclaimed-project.banner.critical.text' : 'unclaimed-project.banner.text',
            {expiry},
          )}
        </Text>
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
            text={t('unclaimed-project.banner.claim-button.text')}
          />
        ) : unclaimed.claimLinkSpent ? null : (
          <Text size={1}>
            <Translate t={t} i18nKey="unclaimed-project.no-claim-url.text" />
          </Text>
        )}
      </Flex>
    </Card>
  )
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
