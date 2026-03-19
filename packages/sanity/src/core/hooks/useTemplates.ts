import {useSource} from '../studio/source'
import type {Template} from '../templates/types'

/**
 *
 * @hidden
 * @beta
 */
export function useTemplates(): Template[] {
  return useSource().templates
}
