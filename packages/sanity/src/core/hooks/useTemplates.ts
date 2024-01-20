import {useSource} from '../studio'
import {type Template} from '../templates'

/**
 *
 * @hidden
 * @beta
 */
export function useTemplates(): Template[] {
  return useSource().templates
}
