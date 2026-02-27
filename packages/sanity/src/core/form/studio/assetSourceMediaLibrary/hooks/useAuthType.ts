import {useToken} from './useToken'

export function useAuthType(): 'token' | 'cookie' {
  const token = useToken()
  return token ? 'token' : 'cookie'
}
