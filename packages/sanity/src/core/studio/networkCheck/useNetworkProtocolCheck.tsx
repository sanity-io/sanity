import {generateHelpUrl} from '@sanity/generate-help-url'
import {useToast} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {useConditionalToast} from 'sanity'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {isUsingModernHttp} from '../../network/isUsingModernHttp'

const HTTP_HELP_URL = generateHelpUrl('http1-performance-issues')

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

  useEffect(() => {
    const sub = isUsingModernHttp(client).subscribe((result) => setIsOnModernHttp(result))
    return () => sub.unsubscribe()
  }, [client, pushToast, title])

  useConditionalToast({
    id: 'network-protocol-check',
    status: 'warning',
    enabled: isOnModernHttp === false,
    title,
    description: <WarningDescription />,
  })
}

function WarningDescription() {
  const {t} = useTranslation()
  const description = t('network-check.slow-protocol-warning.description')
  const readMore = t('network-check.slow-protocol-warning.learn-more')
  return (
    <>
      {description}{' '}
      <a href={HTTP_HELP_URL} target="_blank" rel="noreferrer">
        {readMore}
      </a>
    </>
  )
}
