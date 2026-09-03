import {globalStyle} from '@vanilla-extract/css'

/**
 * The plugin sets `font-weight` on the `<td>`, but Sanity UI's `Text` sets its own weight and
 * breaks the inheritance, so header text needs this rule. Scoped to the plugin's own root class
 * (`.pt-plugin-table` is rendered by `@portabletext/plugin-table/ui` on its `<table>`).
 */
globalStyle(`.pt-plugin-table td[data-pt-plugin-table-header] [data-ui='Text']`, {
  fontWeight: 'var(--pt-plugin-table-header-weight, 600)',
})
