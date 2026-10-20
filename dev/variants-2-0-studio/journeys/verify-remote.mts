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
// Two more studio tabs listen as well. The rule: commands go to the tab that was active most recently (here: `main`).
const extra = []
for (const path of ['/presentation', '/releases']) {
  const tab = await context.newPage()
  await tab.goto(`${base}/#token=${encodeURIComponent(token)}`)
  await tab.waitForTimeout(2500)
  await tab.goto(`${base}${path}`)
  await tab.getByRole('button', {name: 'Design options'}).waitFor({timeout: 40000})
  extra.push(tab)
}
await main.bringToFront()
await main.mouse.click(600, 400)
// Open the remote the way a user does: the Journeys remote button of the Design options window. The remote starts bound to that tab.
await main.getByRole('button', {name: 'Design options'}).click()
const [remote] = await Promise.all([context.waitForEvent('page'), main.getByRole('dialog', {name: 'Design options'}).getByRole('button', {name: 'Journeys remote'}).click()])
let steps = 0
let matched = 0
const misses: string[] = []
try {
  await remote.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  log(true, 'Remote reports Connected', await remote.locator('#state').innerText())
  let expectedPreset = (await remote.locator('#state').getAttribute('data-preset')) ?? ''
  for (const journey of journeys) {
    if (!journey.steps.length) continue
    await remote.locator(`button.jr[data-journey="${journey.id}"]`).click()
    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i]
      steps++
      const wantPreset = presets.includes(step.preset ?? journey.id) ? (step.preset ?? journey.id) : expectedPreset
      expectedPreset = wantPreset
      const wantPath = (step.route ?? '').split('?')[0]
      await remote.locator(`#steps button[data-step="${i}"]`).click()
      // The truth is the studio page itself: its own pathname, read here, not what it reports.
      let real = ''
      try {
        await main.waitForFunction((path) => path === '' || window.location.pathname.startsWith(path), wantPath, {timeout: 15000})
      } catch {
        // reported below
      }
      real = await main.evaluate(() => window.location.pathname)
      await remote.waitForFunction((p) => document.getElementById('state')?.dataset.preset === p, wantPreset, {timeout: 6000}).catch(() => undefined)
      const reported = {preset: (await remote.locator('#state').getAttribute('data-preset')) ?? '', path: (await remote.locator('#state').getAttribute('data-path')) ?? ''}
      const ok = real.startsWith(wantPath) && reported.preset === wantPreset && (wantPath === '' || reported.path.startsWith(wantPath))
      if (ok) matched++
      else misses.push(`${journey.id}-${i + 1}: want ${wantPreset} ${wantPath}, studio is at ${real}, reports ${reported.preset} ${reported.path}`)
    }
  }
  log(matched === steps, `Controller drove ${steps} steps; the studio page's own pathname and the reported preset matched on ${matched}`, misses.slice(0, 3).join(' | '))
  const others = await Promise.all(extra.map((t) => t.evaluate(() => window.location.pathname)))
  log(others[0].startsWith('/presentation') && others[1] === '/releases', 'The other studio tabs ignored the commands (only the most recently active tab acts)', others.join(', '))
  log((await remote.locator('#state').getAttribute('data-tabs')) === '3', 'The status line counts the three studio tabs', await remote.locator('#state').innerText())
  // Keyboard and checks on the journeys remote.
  await remote.locator(`button.jr[data-journey="${journeys[0].id}"]`).click()
  await remote.locator('body').click({position: {x: 5, y: 5}})
  await remote.keyboard.press('ArrowRight')
  await remote.keyboard.press('j')
  const pos = await remote.locator('#stepTitle').innerText()
  log(/^3\//.test(pos), 'Keyboard: right arrow and j move to the next step', pos)
  await remote.keyboard.press('k')
  log(/^2\//.test(await remote.locator('#stepTitle').innerText()), 'Keyboard: k moves back')
  await remote.locator('#done').check()
  const doneKey = await remote.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('variants-2-0-studio:journey-checks') || '{}')).length)
  await remote.getByRole('button', {name: 'Reset checks'}).click()
  log(doneKey > 0 && (await remote.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('variants-2-0-studio:journey-checks') || '{}')).length)) === 0, 'Done checkbox writes the shared key; Reset checks clears the journey')

  // The Design options remote, open at the same time as the journeys remote.
  const options = await context.newPage()
  await options.goto(`${base}/static/options-remote.html?tab=${new URL(remote.url()).searchParams.get('tab')}`)
  await options.waitForFunction(() => document.getElementById('conn')?.textContent === 'Connected', null, {timeout: 20000})
  log(true, 'Both remotes are connected at the same time')
  await options.locator('button[data-stage="ga"]').click()
  await options.waitForFunction(() => document.getElementById('state')?.dataset.stage === 'ga', null, {timeout: 8000}).catch(() => undefined)
  log((await options.locator('#state').getAttribute('data-stage')) === 'ga' && (await remote.locator('#state').getAttribute('data-stage')) === 'ga', 'Stage GA from the options remote reaches the studio and the journeys remote')
  await options.locator('button[data-stage="open-beta"]').click()
  await options.locator('button[data-preset="open-beta-b"]').click()
  await options.waitForFunction(() => document.getElementById('state')?.dataset.preset === 'open-beta-b', null, {timeout: 8000}).catch(() => undefined)
  log((await options.locator('#state').getAttribute('data-preset')) === 'open-beta-b', 'A preset button applies the preset')
  await options.locator('.comp[data-component="c2"] button[data-option="b"]').click()
  await options.waitForFunction(() => document.querySelector('.comp[data-component="c2"] button[data-option="b"]')?.classList.contains('on'), null, {timeout: 8000}).catch(() => undefined)
  log(await options.locator('.comp[data-component="c2"] button[data-option="b"].on').isVisible(), 'An option slot button sets that component option in the studio')
  await options.locator('button[data-show="stock"]').click()
  await options.waitForTimeout(800)
  log(await options.locator('button[data-show="stock"].on').isVisible(), 'Show Stock from the options remote')

  // Walk steps that play a designer step: the number must exist in the flow; the card is highlighted.
  const flows = JSON.parse(readFileSync('options/studio-flows.json', 'utf8')) as {tasks: {flows: {id: string; steps: {n: number}[]}[]}[]}
  const byId = new Map(flows.tasks.flatMap((t) => t.flows).map((f) => [f.id, f]))
  let linked = 0
  const bad: string[] = []
  for (const j of journeys as (typeof journeys[number] & {flow?: string | null; steps: {flowStep?: number | string | null}[]})[]) {
    j.steps.forEach((st, i) => {
      if (st.flowStep == null) return
      linked++
      const f = j.flow ? byId.get(j.flow) : undefined
      const ok = typeof st.flowStep === 'string' ? ['trigger', 'success', 'failure'].includes(st.flowStep) : !!f?.steps.some((x) => x.n === st.flowStep)
      if (!ok) bad.push(`${j.id}-${i + 1} -> ${st.flowStep}`)
    })
  }
  log(bad.length === 0, `${linked} walk steps play a designer step; every number exists in its flow`, bad.slice(0, 5).join(', '))
  const linkedStep = (journeys as {id: string; flow?: string | null; steps: {flowStep?: number | string | null}[]}[]).flatMap((j) => j.steps.map((st, i) => ({j, st, i}))).find((x) => typeof x.st.flowStep === 'number' && byId.has(x.j.flow ?? ''))
  if (linkedStep) {
    await remote.locator(`button.jr[data-journey="${linkedStep.j.id}"]`).click()
    await remote.locator(`#steps button[data-step="${linkedStep.i}"]`).click()
    await remote.waitForTimeout(600)
    log((await remote.locator(`.card.cur[data-n="${linkedStep.st.flowStep}"]`).count()) === 1, 'The designer card of the current walk step is highlighted', `${linkedStep.j.id}-${linkedStep.i + 1} -> step ${linkedStep.st.flowStep}`)
  }
} catch (e) {
  log(false, 'script error', String(e).split('\n')[0])
}
await b.close()
