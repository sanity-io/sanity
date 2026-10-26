import {PlugIcon} from '@sanity/icons/Plug'
import {apiVersion} from '@sanity/preview-url-secret/constants'
import {Button} from '@sanity/ui'
import {type ToastParams, useToast} from '@sanity/ui/toast'
import {useState} from 'react'
import {type SanityClient, useClient} from 'sanity'

export function CorsCheckButton() {
  // The API version of the Presentation tool's clients
  const client = useClient({apiVersion})
  const {push: pushToast} = useToast()
  const [checking, setChecking] = useState(false)

  async function handleClick() {
    setChecking(true)
    pushToast(await checkCors(client))
    setChecking(false)
  }

  return (
    <Button
      data-testid="cors-check-debug-button"
      fontSize={1}
      icon={PlugIcon}
      loading={checking}
      mode="bleed"
      onClick={() => void handleClick()}
      padding={2}
      text="Check CORS"
    />
  )
}

/**
 * Sends the `/check/cors` request that `@sanity/client` sends before it reconnects a live events
 * stream. The browser sets the `Origin` header, so the answer is the one this page's origin gets.
 */
async function checkCors(client: SanityClient): Promise<ToastParams> {
  try {
    const response = await fetch(client.getUrl('/check/cors', false), {
      method: 'GET',
      credentials: 'omit',
    })
    const body = await response.text()
    const rejected = response.ok && isRejected(body, client.config().withCredentials === true)
    return {
      status: rejected ? 'error' : 'success',
      title: rejected ? 'Presentation would throw CorsOriginError' : 'Presentation would reconnect',
      description: `HTTP ${response.status} ${body}`,
    }
  } catch (err) {
    return {status: 'error', title: '/check/cors request failed', description: String(err)}
  }
}

/**
 * Whether `@sanity/client` throws `CorsOriginError` on this answer for the Presentation tool's
 * `live.events({includeDrafts: true})` stream, which also needs `withCredentials` when the client
 * sends credentials
 */
function isRejected(body: string, requireCredentials: boolean): boolean {
  try {
    const parsed: unknown = JSON.parse(body)
    const result = isRecord(parsed) ? parsed.result : undefined
    if (!isRecord(result)) return false
    return result.allowed === false || (requireCredentials && result.withCredentials === false)
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
