// Smoke check for @sanity/groq-store-wasm in a built test studio, run by
// .github/workflows/groq-store-wasm-eval.yml. Opens the studio served by `sanity preview`, waits
// until the service worker controls the page, then asks the public `test` dataset for `count(*)`
// until the wasm store answers (`x-groq-wasm: hit`) and checks the answer against Content Lake.
// Usage: node dev/test-studio/plugins/groq-store-wasm/smoke.mjs [studioUrl]
// oxlint-disable no-await-in-loop -- polls the store one query at a time, on purpose
import {chromium} from 'playwright'

const studioUrl = process.argv[2] ?? 'http://localhost:3333'
const queryUrl =
  'https://ppsg7ml5.api.sanity.io/v2025-02-19/data/query/test?query=' +
  encodeURIComponent('count(*[_type == "author"])')
const deadline = Date.now() + 5 * 60_000

const expected = await fetch(queryUrl).then((response) => response.json())
console.log(`Content Lake: ${JSON.stringify(expected.result)}`)

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  page.on('console', (message) => {
    if (message.text().includes('groq-store-wasm')) console.log(`[page] ${message.text()}`)
  })
  // `?groqStore=on` because the store stays off in automated browsers otherwise
  await page.goto(`${studioUrl}/?groqStore=on`)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 60_000,
  })
  console.log('service worker controls the page')

  let attempt = 0
  for (;;) {
    attempt += 1
    const reply = await page.evaluate(async (url) => {
      const response = await fetch(url)
      return {
        status: response.status,
        hit: response.headers.get('x-groq-wasm'),
        body: await response.json(),
      }
    }, queryUrl)
    console.log(`attempt ${attempt}: status ${reply.status}, x-groq-wasm ${reply.hit ?? '-'}`)
    if (reply.hit === 'hit') {
      if (JSON.stringify(reply.body.result) !== JSON.stringify(expected.result)) {
        throw new Error(
          `store answered ${JSON.stringify(reply.body.result)}, Content Lake ${JSON.stringify(expected.result)}`,
        )
      }
      console.log(`store answered ${JSON.stringify(reply.body.result)}, same as Content Lake`)
      break
    }
    if (Date.now() > deadline) throw new Error('the store did not answer within 5 minutes')
    await page.waitForTimeout(2000)
  }
} finally {
  await browser.close()
}
