import {Path} from '@sanity/types'
import {getValueAtPath} from '../field'
import {useUnique} from '../util'
import {useFormBuilder} from './useFormBuilder'

/**
 * @beta
 */
export function useFormValue(path: Path): unknown {
  const uniquePath = useUnique(path)
  const {value} = useFormBuilder()

  return getValueAtPath(value, uniquePath)
}
