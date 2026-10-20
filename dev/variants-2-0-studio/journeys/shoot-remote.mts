// The Journeys remote beside the studio window it drives, light and dark, at three walk steps of j01 and j03
// -> journeys-captures/remote/<journey>-step<n>-<theme>.png (studio left, remote right). node journeys/shoot-remote.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir, tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/remote', {recursive: true})
const scratch = tmpdir()
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  const studioCtx = await b.newContext({viewport: {width: 820, height: 800}, colorScheme: theme})
  const remoteCtx = await b.newContext({viewport: {width: 1280, height: 800}, colorScheme: theme})
  // Same origin, different contexts would not share a BroadcastChannel: use one context and two pages, sized by screenshot clip.
  await studioCtx.close()
  await remoteCtx.close()
  const context = await b.newContext({viewport: {width: 1280, height: 800}, colorScheme: theme})
  const main = await context.newPage()
  await main.setViewportSize({width: 820, height: 800})
  await main.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await main.waitForTimeout(3500)
  await main.goto('http://localhost:3350/structure/book')
  await main.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  await main.mouse.click(400, 400)
  const remote = await context.newPage()
  await remote.goto('http://localhost:3350/static/remote.html')
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  for (const [id, steps] of [['j01', [0, 1, 2]], ['j03', [0, 2, 4]]] as const) {
    await remote.locator(`button.jr[data-journey="${id}"]`).click()
    for (const i of steps) {
      await remote.locator(`#steps button[data-step="${i}"]`).click()
      await remote.waitForTimeout(2800)
      const a = join(scratch, `studio-${id}-${i}-${theme}.png`)
      const r = join(scratch, `remote-${id}-${i}-${theme}.png`)
      await main.screenshot({path: a})
      await remote.screenshot({path: r})
      execFileSync('python3', ['-c', `from PIL import Image;a=Image.open(${JSON.stringify(a)});r=Image.open(${JSON.stringify(r)});c=Image.new('RGB',(a.width+r.width+12,max(a.height,r.height)),'#888');c.paste(a,(0,0));c.paste(r,(a.width+12,0));c.save('journeys-captures/remote/${id}-step${i + 1}-${theme}.png')`])
    }
  }
  await context.close()
}
await b.close()
