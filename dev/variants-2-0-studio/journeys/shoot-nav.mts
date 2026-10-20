// navLayout A, B, C with compare off and on, at 1280, 1440 and 2200, light and dark. -> journeys-captures/e9-nav/<opt>-<compare>-<width>-<theme>.png
// node journeys/shoot-nav.mts
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
mkdirSync('journeys-captures/e9-nav', {recursive: true})
const b = await chromium.launch()
for (const theme of ['light', 'dark'] as const) {
  for (const width of [1280, 1440, 2200] as const) {
    for (const opt of ['a', 'b', 'c'] as const) {
      for (const cmp of ['off', 'on'] as const) {
        const context = await b.newContext({viewport: {width, height: 420}, colorScheme: theme})
        const p = await context.newPage()
        await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
        await p.waitForTimeout(2200)
        const rack = cmp === 'on' ? 'e9Case;e9-visitors;e9-visitors,localPerspective=drafts,localVariant=aud-members' : 'e9Case;e9-visitors'
        await p.goto(`http://localhost:3350/structure/${rack}?design=show.a,stage.open-beta,navLayout.${opt},compare.c,paneAddress.c&perspective=drafts&variant=aud-returning-visitors`)
        await p.getByTestId('studio-navbar').waitFor({timeout: 60000})
        await p.waitForTimeout(5500)
        await p.screenshot({path: `journeys-captures/e9-nav/${opt}-${cmp}-${width}-${theme}.png`, clip: {x: 0, y: 0, width, height: 190}})
        await context.close()
      }
    }
  }
}
await b.close()
