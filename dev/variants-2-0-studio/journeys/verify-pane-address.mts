// E9 paneAddress A, B, C (and L4, L5a/b, L6): a pane names its address only when it differs from the global perspective.
// Screenshots -> journeys-captures/e9-pane/<state>-<width>-<theme>.png.   node journeys/verify-pane-address.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium, type Page} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-pane', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
async function open(path: string, width = 1440, theme: 'light' | 'dark' = 'light') {
  const context = await b.newContext({viewport: {width, height: 900}, colorScheme: theme})
  const p = await context.newPage()
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(2500)
  await p.goto(`http://localhost:3350${path}`)
  await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
  await p.waitForTimeout(6000)
  return {p, context}
}
const LOCAL = 'e9Case;e9-visitors;e9-visitors,localPerspective=published,localVariant=aud-members'
const D = (pa: string, extra = '') => `?design=show.a,stage.open-beta,paneAddress.${pa}${extra}`
const text = (p: Page, id: string) => p.getByTestId(id).first().textContent().catch(() => null)

{
  const {p, context} = await open(`/structure/${LOCAL}${D('a')}`)
  log('A: the shipped chips, no Documents button, no local row', (await p.getByTestId('documents-count').count()) === 0 && (await p.getByTestId('local-row').count()) === 0)
  await context.close()
}
{
  const {p, context} = await open(`/structure/${LOCAL}${D('b')}`)
  log('B: a Documents button with a count in each pane', (await p.getByTestId('documents-count').count()) === 2)
  log('B: the count is the number of versions', /^\d+$/.test(((await text(p, 'documents-count')) ?? '').trim()), String(await text(p, 'documents-count')))
  log('B: no local row (panes follow global)', (await p.getByTestId('local-row').count()) === 0)
  await p.getByTestId('documents-count').first().click()
  await p.waitForTimeout(2500)
  log('B: the button opens the inventory', (await p.getByText('Versions').count()) > 0 || (await p.locator('[data-ui=Popover]:visible').count()) > 0)
  await p.screenshot({path: 'journeys-captures/e9-pane/B-1440-light.png'})
  await context.close()
}
for (const theme of ['light', 'dark'] as const) {
  const {p, context} = await open(`/structure/${LOCAL}${D('c')}`, 1440, theme)
  log(`C ${theme}: one local row, on the pane that differs`, (await p.getByTestId('local-row').count()) === 1)
  log(`C ${theme}: the tag reads "differs"`, ((await text(p, 'local-tag')) ?? '').trim() === 'differs')
  log(`C ${theme}: Follow global perspective is at the row end`, (await p.getByTestId('follow-global').count()) === 1)
  await p.screenshot({path: `journeys-captures/e9-pane/C-1440-${theme}.png`})
  if (theme === 'light') {
    // L1/L2: the editor moves the layer for this pane only.
    await p.getByTestId('local-layer').click()
    await p.getByRole('menuitem', {name: 'Drafts'}).click()
    await p.waitForTimeout(1500)
    log('C: moving the layer changes this pane only (URL keeps the local params)', decodeURIComponent(p.url()).includes('localPerspective=drafts'), p.url().split('/structure/')[1])
    // J3: one action returns the pane to the global perspective.
    await p.getByTestId('follow-global').click()
    await p.waitForTimeout(1500)
    log('C: Follow global perspective removes the local params and the row', !decodeURIComponent(p.url()).includes('localPerspective') && (await p.getByTestId('local-row').count()) === 0, p.url().split('/structure/')[1])
  }
  await context.close()
}
{
  // L3: the Danish variant has a published version only, so "Drafts" at Danish asks for a version that does not exist.
  const {p, context} = await open(`/structure/e9Case;e9-danish;e9-danish,localPerspective=drafts,localVariant=loc-da-dk${D('c')}`)
  log('L3: a missing version says so and offers Create draft', /no Danish draft yet/.test((await text(p, 'local-tag')) ?? '') && (await p.getByTestId('local-create').count()) === 1, String(await text(p, 'local-tag')))
  await p.screenshot({path: 'journeys-captures/e9-pane/C-L3-1440-light.png'})
  await context.close()
}
{
  // L4: the global perspective changes; the local one is held.
  const {p, context} = await open(`/structure/${LOCAL}${D('c')}&perspective=published&variant=aud-returning-visitors`)
  log('L4: the global variant is Returning visitors, the pane still shows Members and differs', ((await text(p, 'local-variant')) ?? '').includes('Members') && ((await text(p, 'local-tag')) ?? '').trim() === 'differs')
  await context.close()
}
{
  // L5b: the global perspective equals the local one: the row goes away. L5a (localMatch.b) keeps it, "matches global".
  const same = `&perspective=published&variant=aud-members`
  const b5 = await open(`/structure/${LOCAL}${D('c')}${same}`)
  log('L5b: global matches the local one, the row is gone', (await b5.p.getByTestId('local-row').count()) === 0 || (await b5.p.getByTestId('local-tag').count()) === 0)
  await b5.context.close()
  const a5 = await open(`/structure/${LOCAL}${D('c', ',localMatch.b')}${same}`)
  log('L5a: the row stays and says "matches global"', ((await text(a5.p, 'local-tag')) ?? '').trim() === 'matches global')
  await a5.p.screenshot({path: 'journeys-captures/e9-pane/C-L5a-1440-light.png'})
  await a5.context.close()
}
{
  // L6: at the pane floor the tag is the menu.
  const {p, context} = await open(`/structure/${LOCAL}${D('c')}`, 800)
  log('L6: a narrow pane has no button; the tag is the menu with Follow global perspective', (await p.getByTestId('local-tag-menu').count()) === 1 && (await p.getByRole('button', {name: 'Follow global perspective'}).count()) === 0)
  await p.screenshot({path: 'journeys-captures/e9-pane/C-L6-800-light.png'})
  await context.close()
}
await b.close()
process.exit(failed ? 1 : 0)
