/* oxlint-disable @sanity/i18n/no-attribute-string-literals, @sanity/i18n/no-attribute-template-literals -- dev-only nudge, copy not yet localized */
import {ClockIcon} from '@sanity/icons/Clock'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../ui-components'
import {useConditionalToast} from '../../hooks'
import {formatTimeLeft, useUnclaimedProject} from './useUnclaimedProject'

/** Dismissing the toast buys this much quiet before it nudges again. */
const SNOOZE_DURATION_MINUTES = 30

/** Below this many hours left, the nudge escalates from caution to critical. */
const CRITICAL_THRESHOLD_MS = 8 * 60 * 60 * 1000

/**
 * Persistent banner + recurring toast nudging the user to claim a minted-but-unclaimed
 * project before it expires. Renders nothing (and fires no toast) for claimed projects
 * and outside dev mode — see {@link useUnclaimedProject}.
 *
 * @internal
 */
export function UnclaimedProjectNudge() {
  const unclaimed = useUnclaimedProject()

  const [snoozedAtRaw, setSnoozedAt] = useSessionStorageState(
    'sanity-studio.unclaimed-project.snooze',
  )

  // "Now" derived from the hook's minute tick (its msLeft counts down from expiresAt), so
  // this stays pure in render yet re-evaluates every minute — once the snooze window lapses
  // the toast returns on its own: the "periodic" part.
  const now = unclaimed ? unclaimed.expiresAt.getTime() - unclaimed.msLeft : 0
  const isSnoozed = Boolean(
    snoozedAtRaw && now - new Date(snoozedAtRaw).getTime() < SNOOZE_DURATION_MINUTES * 60_000,
  )

  const handleSnooze = useCallback(() => setSnoozedAt(new Date().toISOString()), [setSnoozedAt])

  const critical = Boolean(unclaimed && unclaimed.msLeft <= CRITICAL_THRESHOLD_MS)
  const timeLeft = unclaimed ? formatTimeLeft(unclaimed.msLeft) : ''

  useConditionalToast({
    id: 'unclaimed-project-nudge',
    status: critical ? 'error' : 'warning',
    enabled: Boolean(unclaimed) && !isSnoozed,
    title: critical
      ? `Last call: ${timeLeft} before this project self-destructs`
      : `This project self-destructs in ${timeLeft}`,
    description: (
      <Stack space={4} paddingY={1}>
        <Text size={1}>
          It&apos;s minted but unclaimed. Claim it — free, takes about a minute — and the content,
          this Studio, and everything you&apos;ve built stay yours for good.
        </Text>
        <Flex gap={3}>
          <Button
            as="a"
            href={unclaimed?.claimUrl}
            target="_blank"
            rel="noreferrer"
            mode="ghost"
            tone="primary"
            size="default"
            icon={LaunchIcon}
            tooltipProps={{content: 'Opens the claim page on sanity.io'}}
            text="Claim this project"
          />
          <Button
            mode="bleed"
            tone="neutral"
            size="default"
            text={`Remind me in ${SNOOZE_DURATION_MINUTES} min`}
            onClick={handleSnooze}
          />
        </Flex>
      </Stack>
    ),
  })

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
          {critical
            ? `Last call — ${timeLeft} until this project and everything in it is deleted.`
            : `You're building on a 72-hour fuse: ${timeLeft} left before this unclaimed project expires.`}
        </Text>
        <Button
          as="a"
          href={unclaimed.claimUrl}
          target="_blank"
          rel="noreferrer"
          mode="default"
          tone={critical ? 'critical' : 'primary'}
          size="default"
          iconRight={LaunchIcon}
          text="Claim it — it's free"
          tooltipProps={{content: `Expires ${unclaimed.expiresAt.toLocaleString()}`}}
        />
      </Flex>
    </Card>
  )
}

function useSessionStorageState(
  key: string,
): [value: string | undefined, setValue: (value: string | undefined) => void] {
  const [state, setState] = useState(() => {
    const stored = sessionStorage.getItem(key)
    return typeof stored === 'string' ? stored : undefined
  })
  const setValue = useCallback(
    (value: string | undefined) => {
      setState(value)
      if (value === undefined) {
        sessionStorage.removeItem(key)
      } else {
        sessionStorage.setItem(key, value)
      }
    },
    [key],
  )
  return [typeof state === 'string' ? state : undefined, setValue]
}
