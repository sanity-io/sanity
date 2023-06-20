import {useSource} from '../studio'
import {Template} from '../templates'

/**
 *
 * @hidden
 * @beta
 */
export function useTemplates(): Template[] {
  return useSource().templates
}
