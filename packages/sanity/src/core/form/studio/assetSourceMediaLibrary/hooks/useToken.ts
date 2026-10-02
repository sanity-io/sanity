import {useClient} from '../../../../hooks/useClient'
import {useClientAuth} from '../../../../hooks/useClientAuth'
import {DEFAULT_API_VERSION} from '../constants'

/**
 * The bearer token the studio client sends, kept current through rotations, or `undefined`
 * for cookie authentication and until the credential has settled.
 */
export function useToken(): string | undefined {
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  return useClientAuth(client)?.token
}
