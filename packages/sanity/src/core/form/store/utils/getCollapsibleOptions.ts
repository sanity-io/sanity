import {ObjectSchemaTypeWithOptions} from '@sanity/types'
import {AUTO_COLLAPSE_DEPTH} from '../constants'

interface CollapsibleOptions {
  collapsible: boolean | undefined
  // Initial collapsed state
  collapsed: boolean | undefined
}

/**
 * Takes an option object that can optionally have a 'collapsed' property
 * (`{collapsed?: boolean, collapsible?: boolean}`)
 * and returns a resolved collapsed state based on configuration and whether it's below a certain nesting level threshold
 - collapsible: boolean - whether the field can be collapsed
 - collapsed: boolean - whether the field is initially collapsed
 * NOTE: If a field is configured with ´collapsed: true´, ignore any ´collapsible´ configuration and make it collapsible no matter what, otherwise it will be left forever collapsed.
 *
 * If the nesting level is deeper than or equal to AUTO_COLLAPSE_DEPTH, the default for the field/fieldset becomes "collapsed"
 *
 * @param options - Whether the field or fieldset should be collapsed
 * @param level - Nesting level
 */
export function getCollapsedWithDefaults(
  options: ObjectSchemaTypeWithOptions['options'] = {},
  level: number,
): CollapsibleOptions {
  if (options?.collapsible === false || options?.collapsable === false) {
    return {collapsible: false, collapsed: false}
  }

  const collapsed =
    // eslint-disable-next-line no-nested-ternary
    typeof options?.collapsed === 'boolean'
      ? options.collapsed
      : level >= AUTO_COLLAPSE_DEPTH
        ? true
        : undefined

  const collapsible =
    options?.collapsible === true || options?.collapsable === true || collapsed === true
      ? true
      : undefined

  return {
    collapsible,
    collapsed,
  }
}
