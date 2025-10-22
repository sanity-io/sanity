import {type Path} from '@sanity/types'
import {toString} from '@sanity/util/paths'

/**
 * Convert a field or input path to an anchor ident that can be used in CSS.
 *
 * @internal
 */
export function pathToAnchorIdent(type: 'input' | 'field', path: Path): string {
  return [
    `--${type}`,
    toString(path)
      .replaceAll(/[^a-z|0-9]+/gi, '_')
      .toLocaleLowerCase(),
  ].join('_')
}
