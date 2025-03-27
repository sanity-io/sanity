import {generateHelpUrl} from '@sanity/generate-help-url'
import {LaunchIcon} from '@sanity/icons'
import {Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {of} from 'rxjs'

import {Button} from '../../../ui-components'
import {useConditionalToast} from '../../hooks'
import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {isUsingLegacyHttp} from '../../network/isUsingLegacyHttp'

const HTTP_HELP_URL = generateHelpUrl('http1-performance-issues')

const SNOOZE_DURATION_HOURS = 24

/**
 * Checks the network protocol used to communicate with the Sanity API and shows a
 * warning toast if it's not using a modern protocol (HTTP/2 or later).
 *
 * @internal
 */
export function useNetworkProtocolCheck(): undefined {
  const {push: pushToast} = useToast()
  const {t} = useTranslation()
  const client = useClient({apiVersion: '2025-03-01'})
  const title = t('network-check.slow-protocol-warning.title')

  const [isOnLegacyHttp, setIsOnLegacyHttp] = useState<boolean | undefined>()

  const [warningSnoozedAtRaw, setWarningSnoozedAt] = useSessionStorageState(
    'sanity-studio.network.check.snooze',
  )

  const warningDismissedAt = useMemo(
    () => (warningSnoozedAtRaw ? new Date(warningSnoozedAtRaw) : undefined),
    [warningSnoozedAtRaw],
  )

  const isWarningSnoozed = useMemo(
    () =>
      warningDismissedAt &&
      new Date().getTime() - warningDismissedAt.getTime() < 1000 * 60 * 60 * SNOOZE_DURATION_HOURS,
    [warningDismissedAt],
  )

  useEffect(() => {
    const observable = isWarningSnoozed ? of(undefined) : isUsingLegacyHttp(client)
    const sub = observable.subscribe((result) => setIsOnLegacyHttp(result))
    return () => sub.unsubscribe()
  }, [client, isWarningSnoozed, pushToast, title, warningDismissedAt])

  const handleSnooze = useCallback(
    () => setWarningSnoozedAt(new Date().toISOString()),
    [setWarningSnoozedAt],
  )

  useConditionalToast({
    id: 'network-protocol-check',
    status: 'warning',
    enabled: isOnLegacyHttp && !isWarningSnoozed,
    title,
    description: (
      <Stack gap={4} paddingY={1}>
        <Flex>
          <Text size={1}>{t('network-check.slow-protocol-warning.description')} </Text>
        </Flex>
        <Flex gap={3}>
          <Button
            as="a"
            href={HTTP_HELP_URL}
            target="_blank"
            rel="noreferrer"
            mode="ghost"
            tone="primary"
            size="default"
            icon={LaunchIcon}
            tooltipProps={{
              content: t('network-check.slow-protocol-warning.learn-more-button.tooltip'),
            }}
            text={t('network-check.slow-protocol-warning.learn-more-button.text')}
          />
          <Button
            mode="bleed"
            tone="neutral"
            size="default"
            text={t('network-check.slow-protocol-warning.snooze-button.text')}
            onClick={handleSnooze}
          />
        </Flex>
      </Stack>
    ),
  })
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
