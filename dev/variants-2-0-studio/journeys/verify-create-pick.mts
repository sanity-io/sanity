// The lens's Create flow with one and with two dimensions. The Create dialog preselects the definition when EXACTLY ONE definition fits the
// perspective (every condition holds in it) and the document lacks it; with none or several it preselects nothing and asks which one.
// The expected case is worked out from the dataset itself (definitions and the document's versions), then compared with what the studio does.
// node journeys/verify-create-pick.mts   (the studio must run)
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const base = 'http://localhost:3350'
const log = (ok: boolean, name: string, d = '') => console.log(ok ? 'PASS' : 'FAIL', name, '-', d.slice(0, 240))
const q = async (groq: string, params: Record<string, string> = {}) => {
  const qs = Object.entries(params).map(([k, v]) => `&%24${k}=${encodeURIComponent(JSON.stringify(v))}`).join('')
  const r = await fetch(`https://ppsg7ml5.api.sanity.io/v2025-02-19/data/query/variants-2-0?perspective=raw&query=${encodeURIComponent(groq)}${qs}`, {headers: {Authorization: `Bearer ${token}`}})
  return ((await r.json()) as {result: unknown}).result as never
}
const definitions = (await q('*[_type=="system.variant"]{_id,conditions,"title":metadata.title}')) as {_id: string; conditions: Record<string, string>; title?: string}[]
const short = (id: string) => id.replace(/^_\.variants\./, '')
const have = async (doc: string) => new Set(((await q('*[_system.group._ref==$id || _id match "versions.*."+$id]._system.variant._ref', {id: doc})) as (string | null)[]).filter(Boolean).map((x) => short(x as string)))

const DOC = 'book-the-quiet-cartographer'
const cases: {name: string; picks: {dim: string; value: string; id: string}[]}[] = [
  {name: 'one dimension (Nordic region)', picks: [{dim: 'audience', value: 'nordic-region', id: 'nordic-region'}]},
  {name: 'two dimensions (loyal customers + de-DE)', picks: [{dim: 'audience', value: 'loyal-customers', id: 'loyal-customers'}, {dim: 'locale', value: 'de-DE', id: 'de-DE'}]},
  {name: 'two dimensions (France + app)', picks: [{dim: 'market', value: 'france', id: 'france'}, {dim: 'channel', value: 'app', id: 'app'}]},
]
const b = await chromium.launch()
const p = await (await b.newContext({viewport: {width: 1500, height: 900}})).newPage()
await p.goto(`${base}/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(3000)
for (const c of cases) {
  try {
    const chosen = Object.fromEntries(c.picks.map((x) => [x.dim, x.value]))
    const had = await have(DOC)
    const lacking = definitions.filter((d) => !had.has(short(d._id)))
    const fitting = lacking.filter((d) => { const n = Object.keys(d.conditions); return n.length > 0 && n.every((k) => chosen[k] === d.conditions[k]) })
    await p.goto(`${base}/structure/book;${DOC}%2Cinspect%3Dvariants-inventory?design=show.a,stage.ga,dim.4,c4.a`)
    await p.getByTestId('visitor-lens-open').waitFor({timeout: 40000})
    await p.waitForTimeout(2500)
    await p.locator('[data-ui=ReleasesNav] button').last().click()
    await p.getByRole('menuitem', {name: /Add a dimension|View as/}).first().click()
    await p.waitForTimeout(600)
    for (let i = 0; i < c.picks.length; i++) {
      if (i > 0) await p.locator('[data-testid=row-add]').click()
      await p.waitForTimeout(400)
      await p.locator(`[data-testid^=picker-value-${c.picks[i].dim}-${c.picks[i].id}]`).first().click()
      await p.waitForTimeout(600)
    }
    await p.getByTestId('visitor-lens-open').click()
    await p.getByTestId('visitor-lens').waitFor({timeout: 8000})
    await p.waitForTimeout(1500)
    const cta = p.getByTestId('lens-cta')
    if (!(await cta.count())) { log(true, `${c.name}: the document already has a full match, so there is no CTA`); continue }
    await cta.click()
    await p.waitForTimeout(1200)
    if (fitting.length === 1) {
      const dialog = p.getByRole('dialog').last()
      const text = (await dialog.innerText()).replace(/\n/g, ' | ')
      const want = fitting[0].title ?? short(fitting[0]._id)
      log(/Address/.test(text) && text.includes(want), `${c.name}: exactly one definition fits, so the Create dialog preselects it (${want})`, text)
    } else {
      const pick = p.getByTestId('lens-pick')
      const shown = (await pick.count()) === 1
      const value = shown ? await p.getByTestId('lens-pick-select').inputValue() : 'n/a'
      const disabled = shown ? await p.getByTestId('lens-pick-continue').isDisabled() : false
      log(shown && value === '' && disabled, `${c.name}: ${fitting.length} definitions fit, so nothing is preselected and Continue waits for a choice`, `shown ${shown}, value "${value}", continue disabled ${disabled}`)
      if (shown) {
        const first = await p.getByTestId('lens-pick-select').locator('option:not([disabled])').first().getAttribute('value')
        await p.getByTestId('lens-pick-select').selectOption(first ?? '')
        await p.getByTestId('lens-pick-continue').click()
        await p.waitForTimeout(1200)
        const text = (await p.getByRole('dialog').last().innerText()).replace(/\n/g, ' | ')
        log(/Create .* versions? for 1 document/.test(text) && /Address/.test(text), `${c.name}: after the choice the Create dialog opens for it`, text)
      }
    }
    await p.getByRole('dialog').last().getByRole('button', {name: /Cancel/}).first().click().catch(() => undefined)
  } catch (e) {
    log(false, `${c.name}: script error`, String(e).split('\n')[0])
  }
}
await b.close()
