import {useSource} from '../studio'
import {Template} from '../templates'

/**
 * @beta
 */
export function useTemplates(): Template[] {
  return useSource().templates
}
