import {generateHelpUrl} from '@sanity/generate-help-url'
import {LaunchIcon} from '@sanity/icons'
import {Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button} from '../../../ui-components'
import {useConditionalToast} from '../../hooks'
import {useClient} from '../../hooks/useClient'
import {useLocale} from '../../i18n'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {intlCache} from '../../i18n/intlCache'
import {isUsingModernHttp} from '../../network/isUsingModernHttp'

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

  const [isOnModernHttp, setIsOnModernHttp] = useState<boolean | undefined>()

  const [warningDismissedAtRaw, setWarningDismissedAt] = useSessionStorageState(
    'sanity-studio.network.check.dismiss',
  )

  const warningDismissedAt = warningDismissedAtRaw ? new Date(warningDismissedAtRaw) : undefined

  useEffect(() => {
    const sub = isUsingModernHttp(client).subscribe((result) => setIsOnModernHttp(result))
    return () => sub.unsubscribe()
  }, [client, pushToast, title])

  const handleSnooze = useCallback(() => {
    setWarningDismissedAt(new Date().toISOString())
  }, [setWarningDismissedAt])
  const {currentLocale} = useLocale()

  intlCache.dateTimeFormat(currentLocale.id, {})

  useConditionalToast({
    id: 'network-protocol-check',
    status: 'warning',
    onClose: handleSnooze,
    enabled:
      isOnModernHttp === false &&
      (!warningDismissedAt ||
        new Date().getTime() - warningDismissedAt.getTime() >
          1000 * 60 * 60 * SNOOZE_DURATION_HOURS),
    title,
    description: (
      <Stack space={4} paddingY={1}>
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
