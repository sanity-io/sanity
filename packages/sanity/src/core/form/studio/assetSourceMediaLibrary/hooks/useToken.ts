import {useClient} from '../../../../hooks'
import {DEFAULT_API_VERSION} from '../constants'

export function useToken(): string | undefined {
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const {token} = client.config()
  return token
}
