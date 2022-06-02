import {useSource} from '../studio'
import {Template} from '../templates'

/**
 * @public
 */
export function useTemplates(): Template[] {
  return useSource().templates
}
