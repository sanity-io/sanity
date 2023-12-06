import {useCallback} from 'react'
import {ClientPerspective} from '@sanity/client'
import {useVisionStore} from '../components/VisionStoreContext'
import {isPerspective} from '../perspectives'

/**
 * @internal
 */
export function useVisionPerspective(): [
  ClientPerspective,
  (value: string, cb?: () => void) => void,
] {
  const {localStorage, perspective, setPerspective: _setPerspective, client} = useVisionStore()

  const setPerspective = useCallback(
    (value: string, cb?: () => void) => {
      if (!isPerspective(value)) {
        return
      }

      localStorage.set('perspective', value)
      _setPerspective(value)
      client.config({perspective: value})

      if (cb) {
        // eslint-disable-next-line callback-return
        cb()
      }
    },
    [_setPerspective, client, localStorage],
  )

  return [perspective, setPerspective]
}
