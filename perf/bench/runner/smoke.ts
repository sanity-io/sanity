// oxlint-disable no-console
/**
 * Phase 1 milestone check: with `pnpm bench:dev` running, drive the studio
 * with a real browser — boot to an editable form, type into the field, and
 * verify (a) every keystroke landed in the mock's document, (b) no console
 * errors or page errors, (c) no unexpected endpoints were hit. This is a
 * hand-rolled precursor of the real interaction session (Phase 2).
 *
 * Usage: pnpm exec tsx runner/smoke.ts [--chars 40] [--headed]
 */
import process from 'node:process'

import {chromium} from 'playwright'

import {DATASET, EXPERIMENT, FAKE_TOKEN} from '../constants'

// The mock's TLS cert is self-signed (mock-api/tls.ts); this script only ever
// talks to localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const STUDIO_URL = `http://localhost:${EXPERIMENT.studioPort}`
const MOCK_URL = `https://localhost:${EXPERIMENT.apiPort}`
const DOCUMENT_ID = 'bench-smoke-doc'
const CHAR_COUNT = Number(process.argv.find((arg, i) => process.argv[i - 1] === '--chars') ?? 40)
const HEADED = process.argv.includes('--headed')

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

async function mockRequest(path: string, body?: unknown): Promise<any> {
  const response = await fetch(`${MOCK_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {'content-type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`)
  return response.json()
}

async function main() {
  // Fresh state: reset the mock and seed the draft we type into
  await mockRequest('/_bench/reset', {})
  await mockRequest('/_bench/seed', {
    documents: [{_id: `drafts.${DOCUMENT_ID}`, _type: 'singleString', stringField: ''}],
  })

  const browser = await chromium.launch({headless: !HEADED})
  const context = await browser.newContext({
    // The mock serves HTTP/2 with a self-signed cert (see mock-api/tls.ts)
    ignoreHTTPSErrors: true,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: STUDIO_URL,
          localStorage: [
            {
              name: `__studio_auth_token_${EXPERIMENT.projectId}`,
              value: JSON.stringify({token: FAKE_TOKEN, time: new Date().toISOString()}),
            },
          ],
        },
      ],
    },
  })
  const page = await context.newPage()

  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(String(error)))

  console.log('[smoke] loading editor…')
  await page.goto(`${STUDIO_URL}/singleString/intent/edit/id=${DOCUMENT_ID};type=singleString`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page
    .locator('[data-testid="form-view"]:not([data-read-only="true"])')
    .waitFor({state: 'visible', timeout: 60_000})

  const input = page.locator('[data-testid="field-stringField"] input[type="text"]').first()
  await input.waitFor({state: 'visible', timeout: 30_000})
  await input.click()

  console.log(`[smoke] typing ${CHAR_COUNT} characters…`)
  let typed = ''
  for (let i = 0; i < CHAR_COUNT; i++) {
    const character = CHARACTERS[i % CHARACTERS.length]
    await page.keyboard.press(character)
    typed += character
    await page.waitForTimeout(50)
  }

  // Wait until the mock's copy of the document matches everything we typed
  // (commits are debounced client-side)
  const deadline = Date.now() + 15_000
  let serverValue: string | undefined
  while (Date.now() < deadline) {
    const {result} = await mockRequest(
      `/v1/data/query/${DATASET}?query=${encodeURIComponent(`*[_id == "drafts.${DOCUMENT_ID}"][0].stringField`)}`,
    )
    serverValue = result
    if (serverValue === typed) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  const {unexpected} = await mockRequest('/_bench/requests')

  await context.close()
  await browser.close()

  const failures: string[] = []
  if (serverValue !== typed) {
    failures.push(`readback mismatch:\n  typed:  "${typed}"\n  server: "${serverValue}"`)
  }
  if (pageErrors.length > 0) {
    failures.push(`page errors:\n${pageErrors.map((e) => `  ${e}`).join('\n')}`)
  }
  if (consoleErrors.length > 0) {
    failures.push(`console errors:\n${consoleErrors.map((e) => `  ${e}`).join('\n')}`)
  }
  if (unexpected.length > 0) {
    failures.push(
      `unexpected endpoints:\n${unexpected.map((u: {method: string; path: string}) => `  ${u.method} ${u.path}`).join('\n')}`,
    )
  }

  if (failures.length > 0) {
    console.error(`[smoke] FAILED\n\n${failures.join('\n\n')}`)
    process.exit(1)
  }
  console.log(
    `[smoke] OK — ${CHAR_COUNT} keystrokes round-tripped, no console/page errors, no unexpected endpoints`,
  )
}

await main()
