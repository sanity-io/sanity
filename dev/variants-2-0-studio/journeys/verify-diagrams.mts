// Every diagram key the registry points at must exist in diagrams.json, and the studio copy must equal the docs file.
// node journeys/verify-diagrams.mts
import {existsSync, readFileSync} from 'node:fs'

const registry = readFileSync('options/registry.ts', 'utf8')
const local = JSON.parse(readFileSync('options/diagrams.json', 'utf8')) as {diagrams: Record<string, unknown>}
const docsPath = '../../../../../docs/initiatives/curation-perspective-selector/diagrams.json'
const keys = new Set<string>()
for (const line of registry.split('\n')) {
  if (!/diagramKey:|frames:/.test(line)) continue
  for (const m of line.matchAll(/'(c\d+\.[a-z0-9.]+)'/g)) keys.add(m[1])
}
let failed = 0
for (const key of [...keys].sort()) {
  const ok = key in local.diagrams
  if (!ok) failed++
  console.log(ok ? 'PASS' : 'FAIL', 'registry key', key, ok ? '' : 'missing from options/diagrams.json')
}
// Generic keys (c1 to c4, c7) are filled in by the registry loop: every option of those components needs its entry.
for (const m of registry.matchAll(/id: '(c[1-4]|c7)',[\s\S]*?options: \[([\s\S]*?)\n    \],/g)) {
  for (const o of m[2].matchAll(/\{id: '([a-c])', label: '([^']+)'|\n\s+id: '([a-c])',\n\s+label: '([^']+)'/g)) {
    const id = o[1] ?? o[3]
    const label = o[2] ?? o[4]
    if (label === 'Not drawn') continue
    const key = `${m[1]}.${id}`
    const ok = key in local.diagrams
    if (!ok) failed++
    console.log(ok ? 'PASS' : 'FAIL', 'generic key', key, ok ? '' : 'missing from options/diagrams.json')
  }
}
if (existsSync(docsPath)) {
  const same = readFileSync(docsPath, 'utf8') === readFileSync('options/diagrams.json', 'utf8')
  if (!same) failed++
  console.log(same ? 'PASS' : 'FAIL', 'options/diagrams.json equals the docs copy', same ? '' : '(recopy the docs file)')
}
console.log(failed ? `${failed} failed` : `all ${keys.size} registry keys found`)
process.exit(failed ? 1 : 0)
