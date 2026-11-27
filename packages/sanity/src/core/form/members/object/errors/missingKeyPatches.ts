import {set, setIfMissing} from '../../../patch/patch'
import {type FormPatch} from '../../../patch/types'

export function getMissingKeyPatches(
  items: ReadonlyArray<Record<string, unknown>>,
  createKey: () => string,
): FormPatch[] {
  return items.flatMap((item, index): FormPatch[] => {
    if (typeof item._key === 'string' && item._key.length > 0) {
      return []
    }
    // setIfMissing skips own properties that are present, so unusable values need set
    return '_key' in item
      ? [set(createKey(), [index, '_key'])]
      : [setIfMissing(createKey(), [index, '_key'])]
  })
}
