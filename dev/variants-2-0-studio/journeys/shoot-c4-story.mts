// Andrej's Storybook story (side panel, interactive demo) beside the studio's option A. Needs a local Storybook (port 6060).
import {chromium} from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 900, height: 900}})).newPage()
await p.goto('http://localhost:6060/iframe.html?id=explorations-variants-2-0-c4-version-inventory-option-a-side-panel--interactive-demo&viewMode=story')
await p.waitForTimeout(6000)
await p.screenshot({path: 'journeys-captures/c4/storybook-option-a-side-panel.png'})
await b.close()
