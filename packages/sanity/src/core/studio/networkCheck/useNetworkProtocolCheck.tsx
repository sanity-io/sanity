import {generateHelpUrl} from '@sanity/generate-help-url'
import {useToast} from '@sanity/ui'
import {useEffect} from 'react'
import {filter} from 'rxjs'

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

  useEffect(() => {
    const sub = isUsingModernHttp(client)
      .pipe(filter((isOnModernHttp) => isOnModernHttp === false))
      .subscribe(() =>
        pushToast({
          id: 'network-protocol-check',
          status: 'warning',
          closable: true,
          // Do not auto-close this one
          duration: +Infinity,
          title,
          description: <WarningDescription />,
        }),
      )
    return () => sub.unsubscribe()
  }, [client, pushToast, title])
}

function WarningDescription() {
  const {t} = useTranslation()
  const description = t('network-check.slow-protocol-warning.description')
  const readMore = t('network-check.slow-protocol-warning.learn-more')
  return (
    <>
      {description}
      <a href={HTTP_HELP_URL} target="_blank" rel="noreferrer">
        {readMore}
      </a>
    </>
  )
}
