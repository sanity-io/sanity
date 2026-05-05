import {DotIcon} from '@sanity/icons'
import {Flex, Stack, Text} from '@sanity/ui'
import {useEffect, useState} from 'react'

import {Button, Dialog} from '../../../ui-components'

/** @internal */
export type HandledError =
  | {type: 'cors'; isStaging: boolean; projectId?: string}
  | {type: 'networkError'; error: Error}
  | {type: 'serverError'; error: Error}
  | {type: 'clientError'; error: Error}

const STATUS_URL = 'https://www.sanity-status.com/api/v2/status.json'
const STATUS_PAGE_URL = 'https://status.sanity.io'
// Statuspage's "indicator" enum: none | minor | major | critical | maintenance
type StatusIndicator = 'none' | 'minor' | 'major' | 'critical' | 'maintenance'
interface SanityStatus {
  indicator: StatusIndicator
  description: string
}

const indicatorTone: Record<StatusIndicator, 'positive' | 'caution' | 'critical' | 'primary'> = {
  none: 'positive',
  minor: 'caution',
  major: 'critical',
  critical: 'critical',
  maintenance: 'primary',
}

/**
 * Fetch overall Sanity status from the public status page. Single in-flight
 * promise per mount — re-renders don't re-fetch.
 */
function useSanityStatus(enabled: boolean): SanityStatus | null {
  const [status, setStatus] = useState<SanityStatus | null>(null)
  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    fetch(STATUS_URL, {signal: controller.signal})
      .then((res) => (res.ok ? res.json() : null))
      .then((body: {status?: SanityStatus} | null) => {
        if (body?.status) setStatus(body.status)
      })
      .catch(() => {
        // ignore — the dialog already shows a generic message
      })
    return () => controller.abort()
  }, [enabled])
  return status
}

/**
 * Dialog shown for request errors that aren't CORS misconfig — network blips,
 * 5xx server errors, and structurally-valid 4xx client errors. CORS uses the
 * dedicated full-screen `CorsOriginErrorScreen` instead.
 *
 * @internal
 */
export function RequestErrorDialog(props: {error: HandledError; onRetry: () => void}) {
  const {error, onRetry} = props
  const sanityStatus = useSanityStatus(error.type === 'serverError')

  const heading =
    error.type === 'serverError'
      ? 'Server error'
      : error.type === 'networkError'
        ? 'Network error'
        : error.type === 'clientError'
          ? 'Request error'
          : 'Unknown error'

  const message =
    error.type === 'serverError'
      ? "The server ran into an issue and couldn't complete the request. Try again, or reload the page."
      : error.type === 'networkError'
        ? "Couldn't connect to the Sanity Servers. Please check your network connection and try again."
        : error.type === 'clientError'
          ? "The studio made a request the server couldn't process. Reload the page to try again. If the problem persists, contact your administrator."
          : 'An unknown request error occurred.'

  return (
    <Dialog
      id="request-error-dialog"
      header={heading}
      width={1}
      // onClose is required for the cancel button slot to render in the
      // shared Dialog footer; we use the same handler as the button so that
      // ESC / external close also reloads the studio.
      onClose={() => window.location.reload()}
      footer={{
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
      }}
    >
      <Stack space={4}>
        <Text>{message}</Text>
        {error.type === 'serverError' && sanityStatus ? (
          <Flex paddingY={2}>
            <Button
              as="a"
              href={STATUS_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              mode="bleed"
              tone={indicatorTone[sanityStatus.indicator]}
              icon={DotIcon}
              text={sanityStatus.description}
            />
          </Flex>
        ) : null}
      </Stack>
    </Dialog>
  )
}
