// oxlint-disable no-console
//
// HAR Recording Script
//
// Records API responses from a running Studio and saves them as HAR (HTTP Archive) files.
// These files are committed to the repo and replayed in CI so that resource-metrics
// tests are fully deterministic and require zero authentication.
//
// Usage:
//   1. Build and start the studio:
//        cd perf/resource-metrics/studio && pnpm build && pnpm start
//   2. In another terminal:
//        pnpm resource-metrics:record -- \
//          --project-a-token=<token-for-ppsg7ml5> \
//          --project-b-token=<token-for-q5caobza>

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

import {chromium} from 'playwright'

const workspaceDir = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(workspaceDir, 'fixtures')

// Matches the projects hardcoded in studio/sanity.config.ts
const WORKSPACES = [
  {name: 'minimal', basePath: '/minimal', projectId: 'ppsg7ml5', project: 'a'},
  {name: 'blog', basePath: '/blog', projectId: 'ppsg7ml5', project: 'a'},
  {name: 'large-schema', basePath: '/large-schema', projectId: 'q5caobza', project: 'b'},
  {name: 'plugin-heavy', basePath: '/plugin-heavy', projectId: 'q5caobza', project: 'b'},
] as const

const {values: args} = parseArgs({
  args: process.argv.slice(2),
  options: {
    'studio-url': {type: 'string', default: 'http://localhost:3400'},
    'project-a-token': {type: 'string'},
    'project-b-token': {type: 'string'},
    headless: {type: 'boolean', default: true},
  },
})

const studioUrl = args['studio-url']!
const projectAToken = args['project-a-token'] || ''
const projectBToken = args['project-b-token'] || ''

if (!projectAToken || !projectBToken) {
  console.error('Both --project-a-token and --project-b-token are required for recording.')
  console.error('')
  console.error('  --project-a-token  Token for ppsg7ml5')
  console.error('  --project-b-token  Token for q5caobza')
  console.error('')
  console.error('Usage:')
  console.error('  pnpm resource-metrics:record -- \\')
  console.error('    --project-a-token=<token> --project-b-token=<token>')
  process.exit(1)
}

function getToken(project: 'a' | 'b'): string {
  return project === 'a' ? projectAToken : projectBToken
}

/**
 * Scrub auth tokens from a HAR file so it can be safely committed to the repo.
 * Removes Authorization headers and cookies that might contain tokens.
 */
function scrubHarFile(harPath: string): void {
  const raw = fs.readFileSync(harPath, 'utf-8')
  const har = JSON.parse(raw)

  for (const entry of har.log.entries) {
    if (entry.request?.headers) {
      entry.request.headers = entry.request.headers.filter(
        (h: {name: string}) => h.name.toLowerCase() !== 'authorization',
      )
    }
    if (entry.request?.cookies) {
      entry.request.cookies = []
    }
    if (entry.response?.cookies) {
      entry.response.cookies = []
    }
  }

  fs.writeFileSync(harPath, JSON.stringify(har, null, 2))
}

async function recordWorkspace(workspace: (typeof WORKSPACES)[number]): Promise<void> {
  const harPath = path.join(fixturesDir, `${workspace.name}.har`)
  const token = getToken(workspace.project)

  console.log(`Recording ${workspace.name} (${workspace.projectId}) → ${workspace.name}.har`)

  const browser = await chromium.launch({headless: args.headless !== false})

  try {
    const context = await browser.newContext({
      recordHar: {
        path: harPath,
        // Only record API calls, not static assets (those are served locally)
        urlFilter: /\/v\d|\/api\/|\/auth\//,
      },
      storageState: {
        cookies: [],
        origins: [
          {
            origin: studioUrl,
            localStorage: [
              {
                name: `__studio_auth_token_${workspace.projectId}`,
                value: JSON.stringify({
                  token,
                  time: new Date().toISOString(),
                }),
              },
            ],
          },
        ],
      },
    })

    const page = await context.newPage()

    await page.goto(`${studioUrl}${workspace.basePath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    })

    // Wait for the Studio to fully load
    await page.locator('[data-ui="Navbar"]').waitFor({state: 'visible', timeout: 60_000})

    // Give the Studio a moment to settle (background API calls, subscriptions, etc.)
    await page.waitForLoadState('networkidle')

    // Close context to flush the HAR file to disk
    await context.close()

    // Scrub auth tokens from the recorded HAR
    scrubHarFile(harPath)

    console.log(`  ✓ Recorded and scrubbed ${workspace.name}`)
  } finally {
    await browser.close()
  }
}

async function main() {
  await fs.promises.mkdir(fixturesDir, {recursive: true})

  console.log(`Recording HAR fixtures from ${studioUrl}`)
  console.log(`Project A: ppsg7ml5`)
  console.log(`Project B: q5caobza`)
  console.log()

  for (const workspace of WORKSPACES) {
    await recordWorkspace(workspace)
  }

  console.log()
  console.log('Done! HAR fixtures written to perf/resource-metrics/fixtures/')
  console.log('Commit these files to the repo. They will be used for deterministic replay in CI.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
