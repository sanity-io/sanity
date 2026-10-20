// The Nordic Books preview alone (no studio): home, list, book, campaign, about at 390, 768 and 1440 px, light and dark,
// for the audiences Base, Members and German (de-DE). The data is fetched here with the CLI token the way the grid does
// (perspective + variant) and pushed into the page with the grid's `grid-data` message. Also checks: no horizontal scroll.
// node journeys/shoot-site.mts -> journeys-captures/site/<route>-<audience>-<width>-<theme>.png
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const w = console.warn
console.warn = (...a: unknown[]) => { if (String(a[0]).includes('experimental')) return; w(...a) }
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token})
const LIST = `*[_type in ["book", "bookLive"]] | order(title asc) {_id, _type, title, subtitle, blurb}`
const ONE = `*[_type in ["book", "bookLive"] && _id == $id][0] {_id, _type, title, subtitle, blurb}`
mkdirSync('journeys-captures/site', {recursive: true})
const AUDIENCES: [string, string | undefined][] = [['base', undefined], ['members', 'aud-members'], ['german', 'loc-de-de']]
const ROUTES = ['home', 'list', 'book:book-lighthouse', 'campaign', 'about']
const WIDTHS: [number, number][] = [[390, 844], [768, 1024], [1440, 900]]
const b = await chromium.launch()
let shots = 0
const overflow: string[] = []
const data = new Map<string, {list: unknown; book: unknown}>()
for (const [name, variant] of AUDIENCES) {
  const options = {perspective: 'drafts', variant} as never
  data.set(name, {list: await x.fetch(LIST, {}, options), book: await x.fetch(ONE, {id: 'book-lighthouse'}, options)})
}
for (const theme of ['light', 'dark'] as const) {
  for (const [width, height] of WIDTHS) {
    const context = await b.newContext({viewport: {width, height}, colorScheme: theme})
    const page = await context.newPage()
    for (const [name, variant] of AUDIENCES) {
      for (const route of ROUTES) {
        const url = `http://localhost:3334/variants-preview.html?mode=grid&frame=s&route=${encodeURIComponent(route)}${variant ? `&variant=${variant}` : ''}`
        await page.goto(url)
        const d = data.get(name)!
        await page.evaluate((payload) => window.postMessage({type: 'grid-data', frame: 's', ...payload}, '*'), d)
        await page.waitForSelector('.site .top', {timeout: 15000})
        await page.waitForTimeout(250)
        const sw = await page.evaluate(() => ({s: document.documentElement.scrollWidth, w: window.innerWidth}))
        if (sw.s > sw.w) overflow.push(`${route} ${name} ${width} ${theme}: ${sw.s} > ${sw.w}`)
        await page.screenshot({path: `journeys-captures/site/${route.split(':')[0]}-${name}-${width}-${theme}.png`, fullPage: false})
        shots++
      }
    }
    await context.close()
  }
}
await b.close()
console.log(`${shots} screenshots; horizontal overflow: ${overflow.length ? overflow.join(' | ') : 'none'}`)
