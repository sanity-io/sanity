import {useSource} from '../studio/source'
import {type Template} from '../templates/types'

/**
 *
 * @hidden
 * @internal
 */
export function useTemplates(): Template[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useSource().templates
}
