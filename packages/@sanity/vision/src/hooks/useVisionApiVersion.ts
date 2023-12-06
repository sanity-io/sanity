import {useCallback, useMemo} from 'react'
import {useVisionStore} from '../components/VisionStoreContext'
import {validateApiVersion} from '../util/validateApiVersion'

/**
 * @internal
 */
interface UseVisionApiVersion {
  apiVersion: string
  setApiVersion: (value: string, cb?: () => void) => void

  customApiVersion: string | false
  setCustomApiVersion: (value: string | false) => void

  isValidApiVersion: boolean
}

/**
 * @internal
 */
export function useVisionApiVersion(): UseVisionApiVersion {
  const {
    localStorage,
    apiVersion,
    customApiVersion,
    setCustomApiVersion: _setCustomApiVersion,
    setApiVersion: _setApiVersion,
    client,
  } = useVisionStore()

  const setApiVersion = useCallback(
    (value: string, cb?: () => void) => {
      // reset customApiVersion
      _setCustomApiVersion(false)

      localStorage.set('apiVersion', value)
      _setApiVersion(value)
      client.config({apiVersion: value})

      if (cb) {
        // eslint-disable-next-line callback-return
        cb()
      }
    },
    [_setApiVersion, _setCustomApiVersion, client, localStorage],
  )

  const setCustomApiVersion = useCallback(
    (value: string | false) => {
      _setCustomApiVersion(value)
    },
    [_setCustomApiVersion],
  )

  const isValidApiVersion = useMemo(
    () => (customApiVersion ? validateApiVersion(customApiVersion) : false),
    [customApiVersion],
  )

  return {
    apiVersion,
    setApiVersion,
    customApiVersion,
    setCustomApiVersion,
    isValidApiVersion,
  }
}
