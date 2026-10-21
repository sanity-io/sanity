import {useOption} from '../options/store'

// The open beta header's frame (spec H1, I6, P1): the pane has a 1 px border left and right, the inspector a 1 px border on its left, and the list
// panes' headers are 45 px so every pane header's bottom line meets the document header's (45 px with its top and bottom border).
const CSS = `
  [data-testid="document-pane"] {border-left: 1px solid var(--card-border-color); border-right: 1px solid var(--card-border-color); box-sizing: border-box}
  [data-ui="DocumentInspectorPanel"] {border-left: 1px solid var(--card-border-color)}
  [data-testid="pane-header"] > [data-ui="Card"] > [data-ui="Flex"] {padding-top: 10px !important; padding-bottom: 9px !important}
`

/** Mounted with the open beta header (c2 C). */
export function ChromeStyles() {
  const on = useOption('c2') === 'c'
  return on ? <style>{CSS}</style> : null
}
