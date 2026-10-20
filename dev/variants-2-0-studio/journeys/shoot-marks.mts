// E9 fieldMarks: screenshots of the Field marks test 2 (Returning visitors draft) in A, B and C, 1440 and 1280, light and dark.
// node journeys/shoot-marks.mts [tag]  -> journeys-captures/e9-marks/<tag>/<option>-<width>-<theme>.png
import {mkdirSync, readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {chromium} from 'playwright'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken as string
const tag = process.argv[2] ?? 'now'
const dir = `journeys-captures/e9-marks/${tag}`
mkdirSync(dir, {recursive: true})
const b = await chromium.launch()
for (const width of [1440, 1280] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const opt of ['a', 'b', 'c'] as const) {
      const context = await b.newContext({viewport: {width, height: 2300}, colorScheme: theme})
      const p = await context.newPage()
      await p.goto(`http://localhost:3350/#token=${encodeURIComponent(token)}`)
      await p.waitForTimeout(2500)
      await p.goto(`http://localhost:3350/structure/fieldMarksTest;fm-2?perspective=drafts&variant=aud-returning-visitors&design=show.a,stage.open-beta,fieldMarks.${opt}`)
      await p.locator('[data-testid="document-pane"]').first().waitFor({timeout: 60000})
      await p.waitForTimeout(6500)
      await p.screenshot({path: `${dir}/${opt}-${width}-${theme}.png`})
      await context.close()
    }
  }
}
await b.close()
