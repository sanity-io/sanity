import {getPublishedId} from '../util'
import {useFormBuilder} from './useFormBuilder'

export function useFormPublishedId(): string | undefined {
  const id = useFormBuilder().id
  return getPublishedId(id)
}
