import {useCallback} from 'react'
import {useVisionStore} from '../components/VisionStoreContext'

/**
 * @internal
 */
export function useVisionDataset(): [string, (value: string, cb?: () => void) => void] {
  const {localStorage, dataset, setDataset: _setDataset, client} = useVisionStore()

  const setDataset = useCallback(
    (value: string, cb?: () => void) => {
      localStorage.set('dataset', value)
      _setDataset(value)
      client.config({dataset: value})

      if (cb) {
        // eslint-disable-next-line callback-return
        cb()
      }
    },
    [_setDataset, client, localStorage],
  )

  return [dataset, setDataset]
}
