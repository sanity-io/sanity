// E9 references: outgoing (hard and weak, in a field, in an array, inline in portable text), incoming (the delete dialog lists the documents that
// refer to an author), and a reference opened in a second pane on its own local perspective. Screenshots -> journeys-captures/e9-refs/.
// node journeys/verify-refs.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-refs', {recursive: true})
let failed = 0
const log = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const b = await chromium.launch()
const context = await b.newContext({viewport: {width: 1440, height: 2600}})
const p = await context.newPage()
await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
await p.waitForTimeout(2500)
await p.goto('http://localhost:3350/structure/book;book-lighthouse?design=show.a,stage.open-beta')
await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
await p.waitForTimeout(6000)
const text = await p.locator('[data-testid="document-pane"]').first().innerText()
log('outgoing: the author reference reads as a document', /Maren Halvorsen/.test(text) && /Author/.test(text))
log('outgoing: the weak publisher reference to an unpublished draft is shown', /Publisher/.test(text))
log('outgoing: related books (an array of hard and weak references)', /Related books/i.test(text))
log('outgoing: portable text with an inline author mention', /Written by/.test(text))
const weak = await p.locator('[data-testid="document-pane"]').first().evaluate((el) => [...el.querySelectorAll('*')].filter((e) => e.children.length === 0 && /weak/i.test(e.textContent ?? '')).length)
log('weak references are labelled', weak > 0, `${weak} nodes say weak`)
await p.screenshot({path: 'journeys-captures/e9-refs/book-outgoing.png'})

// Incoming: the delete dialog of an author lists the books that refer to it.
await p.goto('http://localhost:3350/structure/author;author-maren-halvorsen?design=show.a,stage.open-beta')
await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
await p.waitForTimeout(5000)
await p.getByTestId('action-menu-button').click().catch(async () => p.locator('[data-testid="pane-context-menu-button"]').click())
await p.getByRole('menuitem', {name: /Delete/}).first().click().catch(() => undefined)
await p.waitForTimeout(3500)
const dialog = (await p.locator('[role="dialog"]').first().innerText().catch(() => '')) ?? ''
log('incoming: the delete dialog lists the documents that refer to the author', /refer/i.test(dialog), dialog.replace(/\s+/g, ' ').slice(0, 140))
await p.screenshot({path: 'journeys-captures/e9-refs/author-incoming.png'})
await p.keyboard.press('Escape')

// A reference opened in a second pane, on its own local perspective, set up by URL.
await p.goto('http://localhost:3350/structure/book;book-lighthouse;author-maren-halvorsen,type=author,localPerspective=published,localVariant=aud-members?design=show.a,stage.open-beta,paneAddress.c')
await p.waitForTimeout(9000)
log('second pane: the reference opens beside the book on its own perspective', (await p.getByTestId('local-row').count()) === 1 && /Members/.test((await p.getByTestId('local-variant').textContent()) ?? ''))
await p.screenshot({path: 'journeys-captures/e9-refs/reference-second-pane.png'})
await b.close()
process.exit(failed ? 1 : 0)
