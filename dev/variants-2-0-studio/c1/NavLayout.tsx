import {useOption} from '../options/store'

// navLayout B and C: the navbar's three groups are flattened (display: contents) so each item can be ordered on one row, without touching core.
//   [workspace] [tools ........ ] [global perspective (C)] [search] [Create] [version pill] [tasks, help, resources, account]
// The navbar is `[data-testid="studio-navbar"] > Grid > (left Flex, tools Flex, right Flex)`; the selectors are positional, which is why this
// lives in the design studio and not in core. Below about 1440 the tools fold into the stock More menu by themselves as the tools Flex shrinks.
const RULES = `
[data-testid="studio-navbar"] > div { display: flex !important; align-items: center; gap: 4px; }
[data-testid="studio-navbar"] > div > div:nth-child(1),
[data-testid="studio-navbar"] > div > div:nth-child(3) { display: contents !important; }
/* left group: workspace first, then Create and search go right */
[data-testid="studio-navbar"] > div > div:nth-child(1) > div:nth-child(1) { order: 1; }
[data-testid="studio-navbar"] > div > div:nth-child(2) { order: 2; flex: 1 1 0%; min-width: 0; justify-content: flex-start !important; }
[data-testid="studio-navbar"] > div > div:nth-child(2) > div { justify-content: flex-start !important; flex: 0 1 auto; }
[data-testid="studio-navbar"] > div > div:nth-child(3) > *:has([data-testid="address-row-inline"]) { order: 8; }
[data-testid="studio-navbar"] > div > div:nth-child(1) > span:has([data-testid="studio-search"]) { order: 10; }
[data-testid="studio-navbar"] > div > div:nth-child(1) > div:nth-child(2) { order: 11; }
[data-testid="studio-navbar"] > div > div:nth-child(3) > * { order: 20; }
[data-testid="studio-navbar"] > div > div:nth-child(3) > [data-ui="ReleasesNav"] { order: 12; }
/* C1 B: the Variants control sits right after the state control */
[data-testid="studio-navbar"] > div > div > [data-testid="open-beta-variants"] { order: 13; }
/* the locale pill (localization C and D) sits after it */
[data-testid="studio-navbar"] > div > div > [data-testid="locale-pill"] { order: 14; }
`

/** Rendered once by the navbar override while navLayout is B or C. */
export function NavLayoutStyles() {
  const layout = useOption('navLayout')
  if (layout === 'a') return null
  return <style data-testid="nav-layout-styles">{RULES}</style>
}
