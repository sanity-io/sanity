// Every Storybook story id the studio links to (the registry and journeys.json) must exist in the Storybook index.
// The index: the local copy docs/initiatives/curation-perspective-selector/storybook-index-variants-2-0.json when it exists,
// else <base>/index.json (the hosted Storybooks sit behind a sign-in, so that may answer with a page, not JSON).
// node journeys/verify-story-links.mts
import {existsSync, readFileSync} from 'node:fs'

const local = '../../../../../docs/initiatives/curation-perspective-selector/storybook-index-variants-2-0.json'
const base = process.env.SANITY_STUDIO_STORYBOOK_BASE ?? 'https://sanity-studio-storybook-git-explorations-variants-2-0.sanity.dev'
let raw: unknown
let source = ''
if (existsSync(local)) {
  raw = JSON.parse(readFileSync(local, 'utf8'))
  source = 'local index file'
} else {
  const res = await fetch(`${base}/index.json`).catch(() => null)
  const type = res?.headers.get('content-type') ?? ''
  if (!res?.ok || !type.includes('json')) {
    console.log(`FAIL no index: ${local} is missing and ${base}/index.json answered ${res ? `${res.status} ${type}` : 'nothing'}`)
    process.exit(1)
  }
  raw = await res.json()
  source = `${base}/index.json`
}
const body = (raw as {entries?: unknown}).entries ?? raw
const entries = Array.isArray(body) ? (body as {id: string}[]).map((e) => e.id) : Object.keys(body as Record<string, unknown>)
const ids = new Set(entries)

const registry = readFileSync('options/registry.ts', 'utf8')
const registryIds = [...new Set([...registry.matchAll(/'(explorations-[a-z0-9-]+--[a-z0-9-]+)'/g)].map((m) => m[1]))]
const journeys = JSON.parse(readFileSync('options/journeys.json', 'utf8')) as {id: string; steps: {story?: string}[]}[]
const journeyIds = [...new Set(journeys.flatMap((j) => j.steps.map((s) => s.story).filter(Boolean) as string[]))]

let failed = 0
const check = (label: string, list: string[]) => {
  const missing = list.filter((id) => !ids.has(id))
  failed += missing.length
  console.log(missing.length ? 'FAIL' : 'PASS', `${label}: ${list.length - missing.length} of ${list.length} story ids exist (${source}, ${ids.size} entries)`)
  for (const id of missing) console.log('  missing', id)
}
check('registry.ts', registryIds)
check('journeys.json', journeyIds)
process.exit(failed ? 1 : 0)
