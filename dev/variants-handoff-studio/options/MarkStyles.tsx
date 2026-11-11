import {useOption} from '../design-options/store'

// The selected list row is the studio's PreviewCard with data-selected. Everything below is scoped to it, so a mark outside a selected row never changes.
const ROW = '[data-ui="PreviewCard"][data-selected]'
const MARK = `${ROW} [data-testid^="version-mark-"]`
const ICON = `${MARK} *`
const BADGE = `${ROW} [data-testid="state-badge"]`
const VARIANT = 'var(--card-badge-suggest-icon-color)'

const CSS: Record<string, string> = {
  b: `
    ${BADGE} {width: 16px !important; height: 16px !important; left: 14px !important; top: -4px !important; background: #fff !important;}
  `,
  c: `
    ${MARK} {background: transparent !important; color: #fff !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.85) !important;}
    ${ICON} {color: #fff !important; --card-icon-color: #fff !important;}
    ${BADGE} {width: 15px !important; height: 15px !important; left: 14.5px !important; top: -3.5px !important; background: #fff !important;}
  `,
  d: `
    ${MARK} {background: ${VARIANT} !important; color: #fff !important;}
    ${ICON} {color: #fff !important; --card-icon-color: #fff !important;}
    ${BADGE} {width: 15px !important; height: 15px !important; left: 14.5px !important; top: -3.5px !important; background: #fff !important;}
  `,
}

/** IC1: the version mark on a selected list row (options/iconography.ts). */
export function MarkStyles() {
  const option = useOption('markSelected')
  const css = CSS[option]
  return css ? <style>{css}</style> : null
}
