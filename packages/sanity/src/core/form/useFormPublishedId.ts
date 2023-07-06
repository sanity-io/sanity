import {getPublishedId} from '../util'
import {useFormValue} from './useFormValue'

export function useFormPublishedId(): string | undefined {
  const id = useFormValue(['_id'])

  if (typeof id !== 'string') {
    return undefined
  }

  return getPublishedId(id)
}
