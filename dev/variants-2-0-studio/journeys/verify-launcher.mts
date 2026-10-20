// The Design options button can be dragged; its place is remembered; a double-click on the grip resets it. There is no separate Journeys button.
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d)
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1300, height: 800}})).newPage()
try {
  await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
  await p.waitForTimeout(3000)
  await p.goto('http://localhost:3350/structure/book')
  await p.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  const launcher = p.locator('[data-testid=options-launcher]')
  const grip = p.locator('[data-testid=options-grip]')
  const gb = (await grip.boundingBox())!
  await p.mouse.move(gb.x + 5, gb.y + 10)
  await p.mouse.down()
  await p.mouse.move(900, 300, {steps: 6})
  await p.mouse.up()
  const moved = (await launcher.boundingBox())!
  log(moved.x > 600 && moved.y < 400, 'Dragging the grip moves the button', `${Math.round(moved.x)}, ${Math.round(moved.y)}`)
  await p.reload()
  await p.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  const kept = (await launcher.boundingBox())!
  log(Math.abs(kept.x - moved.x) < 3 && Math.abs(kept.y - moved.y) < 3, 'The place is remembered after a reload', `${Math.round(kept.x)}, ${Math.round(kept.y)}`)
  await p.locator('[data-testid=options-grip]').dblclick()
  const reset = (await launcher.boundingBox())!
  log(reset.x < 40 && reset.y > 600, 'Double-click on the grip resets to the bottom left', `${Math.round(reset.x)}, ${Math.round(reset.y)}`)
  log((await p.getByRole('button', {name: 'Journeys', exact: true}).count()) === 0, 'There is no separate Journeys button')
} catch (e) {
  log(false, 'script error', String(e).split('\n')[0])
}
await b.close()
