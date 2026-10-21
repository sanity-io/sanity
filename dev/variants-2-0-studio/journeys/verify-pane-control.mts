// E9 paneControl A/B (Figma E10 D1-D3) and the inert "Save as composite" stub in the columns picker.
// Screenshots -> journeys-captures/e9-panecontrol/<state>-<theme>.png.   node journeys/verify-pane-control.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-panecontrol', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string, theme: 'light' | 'dark' = 'light') {
  const context = await b.newContext({viewport: {width: 1440, height: 900}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6000)
  return {p, context}
}
const URL = '/structure/e9Case;e9-visitors?design=show.a,stage.open-beta'
{
  const {p, context} = await open(`${URL},paneControl.a`)
  log('A: no pane control', (await p.getByTestId('pane-control').count()) === 0)
  await context.close()
}
for (const theme of ['light', 'dark'] as const) {
  const {p, context} = await open(`${URL},paneControl.b`, theme)
  const chip = p.getByTestId('pane-control').first()
  log(`B ${theme}: the chip says Follows global`, ((await chip.textContent()) ?? '').includes('Follows global'))
  await chip.click()
  await p.waitForTimeout(1200)
  log(`B ${theme}: it opens the column picker (version + audience columns)`, (await p.getByTestId('pane-control-picker').count()) > 0 && (await p.locator('[data-testid^="column-"]').count()) >= 2, String(await p.locator('[data-testid^="column-"]').count()))
  if (theme === 'light') {
    const save = p.getByTestId('picker-save-composite').first()
    log('stub: Save perspective as preset is present and disabled', (await save.count()) === 1 && (await save.isDisabled()), (await save.textContent().catch(() => '')) ?? '')
    await p.getByTestId('picker-value-layer-published').first().click()
    await p.waitForTimeout(1500)
    log('B: picking Published holds a local perspective for this pane', decodeURIComponent(p.url()).includes('localPerspective=published'), decodeURIComponent(p.url()).split('/structure/')[1])
    log('B: the chip now reads Local · Published', (((await p.getByTestId('pane-control').first().textContent()) ?? '').includes('Local · Published')))
    await p.screenshot({path: `journeys-captures/e9-panecontrol/held-${theme}.png`})
    if ((await p.getByTestId('picker-clear').count()) === 0) await p.getByTestId('pane-control').first().click()
    await p.getByTestId('picker-clear').first().click()
    await p.waitForTimeout(1500)
    log('B: Clear follows global again (params gone)', !decodeURIComponent(p.url()).includes('localPerspective'))
  } else await p.screenshot({path: `journeys-captures/e9-panecontrol/open-${theme}.png`})
  await context.close()
}
await b.close()
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
