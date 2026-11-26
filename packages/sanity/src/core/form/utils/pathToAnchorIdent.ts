import {type Path} from '@sanity/types'
import {toString} from '@sanity/util/paths'

/**
 * Convert a field, input or label path to an anchor ident that can be used in CSS. The label is the
 * title row of a field, which every kind of field has, so a mark can follow it.
 *
 * @internal
 */
export function pathToAnchorIdent(type: 'input' | 'field' | 'label', path: Path): string {
  return [
    `--${type}`,
    toString(path)
      .replaceAll(/[^a-z|0-9]+/gi, '_')
      .toLocaleLowerCase(),
  ].join('_')
}
