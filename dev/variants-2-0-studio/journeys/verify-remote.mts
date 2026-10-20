// The Journeys remote: two pages in one browser context. The controller (static/remote.html) drives the studio window
// through every step of every journey; the route and the preset the studio reports back must match the step.
// node journeys/verify-remote.mts   (the studio must run)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const journeys = JSON.parse(readFileSync('options/journeys.json', 'utf8')) as {id: string; steps: {title: string; preset?: string; route?: string}[]}[]
const presets = (JSON.parse(readFileSync('options/presets.json', 'utf8')) as {id: string}[]).map((p) => p.id)
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 200))
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1300, height: 850}})
const main = await context.newPage()
await main.goto(`${base}/#token=${encodeURIComponent(token)}`)
await main.waitForTimeout(3500)
await main.goto(`${base}/structure/book`)
await main.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
const remote = await context.newPage()
await remote.goto(`${base}/static/remote.html`)
let steps = 0
let matched = 0
const misses: string[] = []
try {
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  log(true, 'Remote reports Connected', await remote.locator('#state').innerText())
  let expectedPreset = (await remote.locator('#state').getAttribute('data-preset')) ?? ''
  for (const journey of journeys) {
    if (!journey.steps.length) continue
    await remote.locator('#journey').selectOption(journey.id)
    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i]
      steps++
      const wantPreset = presets.includes(step.preset ?? journey.id) ? (step.preset ?? journey.id) : expectedPreset
      expectedPreset = wantPreset
      const wantPath = (step.route ?? '').split('?')[0]
      await remote.locator(`li[data-step="${i}"] .t`).click()
      let got = {preset: '', path: ''}
      try {
        await remote.waitForFunction(
          ({p, path}) => {
            const s = document.getElementById('state')!
            return s.dataset.preset === p && (path === '' || (s.dataset.path ?? '').split('?')[0].startsWith(path))
          },
          {p: wantPreset, path: wantPath},
          {timeout: 15000},
        )
      } catch {
        // reported below
      }
      got = {preset: (await remote.locator('#state').getAttribute('data-preset')) ?? '', path: (await remote.locator('#state').getAttribute('data-path')) ?? ''}
      const ok = got.preset === wantPreset && (wantPath === '' || got.path.split('?')[0].startsWith(wantPath))
      if (ok) matched++
      else misses.push(`${journey.id}-${i + 1}: want ${wantPreset} ${wantPath}, got ${got.preset} ${got.path}`)
    }
  }
  log(matched === steps, `Controller drove ${steps} steps; the reported route and preset matched on ${matched}`, misses.slice(0, 3).join(' | '))
  // Keyboard, stage and checks.
  await remote.locator('#journey').selectOption(journeys[0].id)
  await remote.locator('body').click({position: {x: 5, y: 5}})
  await remote.keyboard.press('ArrowRight')
  await remote.keyboard.press('j')
  const pos = await remote.locator('#pos').innerText()
  log(/step 3 of/.test(pos), 'Keyboard: right arrow and j move to the next step', pos)
  await remote.keyboard.press('k')
  log(/step 2 of/.test(await remote.locator('#pos').innerText()), 'Keyboard: k moves back')
  await remote.getByRole('button', {name: 'GA', exact: true}).click()
  await remote.waitForFunction(() => document.getElementById('state')?.dataset.stage === 'ga', null, {timeout: 8000}).catch(() => undefined)
  log((await remote.locator('#state').getAttribute('data-stage')) === 'ga', 'Stage GA from the remote drives the studio')
  await remote.getByRole('button', {name: 'Open beta', exact: true}).click()
  await remote.waitForFunction(() => document.getElementById('state')?.dataset.stage === 'open-beta', null, {timeout: 8000}).catch(() => undefined)
  log((await remote.locator('#state').getAttribute('data-stage')) === 'open-beta', 'Stage Open beta from the remote drives the studio')
  await remote.locator('li[data-step="0"] input[type=checkbox]').check()
  await remote.getByRole('button', {name: 'Reset checks'}).click()
  log(!(await remote.locator('li[data-step="0"] input[type=checkbox]').isChecked()), 'Reset checks clears the journey')
} catch (e) {
  log(false, 'script error', String(e).split('\n')[0])
}
await b.close()
