import {type GridProps} from 'ui5'

/**
 * Maps schema `options.columns` onto ui5 Grid `gridTemplateColumns`.
 *
 * @internal
 */
export function getGridTemplateColumns(
  columns: number | number[],
): GridProps['gridTemplateColumns'] {
  if (Array.isArray(columns)) {
    return columns.map((n) => `repeat(${n}, minmax(0, 1fr))`) as GridProps['gridTemplateColumns']
  }
  return `repeat(${columns}, minmax(0, 1fr))`
}
