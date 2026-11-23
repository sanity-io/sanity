import {type TableContentSize} from '../components/Table/Table'

/**
 * The content column of overview pages, as a theme container size: 4, 1600px.
 *
 * Every band on the page (toolbar, timeline, command lane, table rows) paints its background and
 * dividers full width, and lines its content up in this one column. On screens wider than the
 * column the content centres; below it, the bands use the full width with the usual gutter.
 * Detail pages use 3 (1280px), the table's default.
 *
 * @internal
 */
export const OVERVIEW_CONTENT_SIZE: TableContentSize = 4
