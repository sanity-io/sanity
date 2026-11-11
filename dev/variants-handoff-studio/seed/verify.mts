// Prints what is actually in the variants-2-0 dataset (raw perspective), grouped by document.
// Read-only. Token read at runtime from the Sanity CLI login, never printed.
import {readFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {createClient} from '@sanity/client'

const warn = console.warn
console.warn = (...args: unknown[]) => {
  if (String(args[0]).includes('experimental API version')) return
  warn(...args)
}
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'sanity', 'config.json'), 'utf8')).authToken
const x = createClient({projectId: 'ppsg7ml5', dataset: 'variants-2-0', apiVersion: 'X', useCdn: false, token, perspective: 'raw'})

const docs: Array<Record<string, any>> = await x.fetch(`*[_type in ["book", "bookLive"]]{_id, _type, title, blurb, _system}|order(_id)`)
const byGroup = new Map<string, typeof docs>()
for (const d of docs) {
  const group = d._id.replace(/^(drafts|versions\.[^.]+)\./, '').replace(/^_\.variants\.[^.]+\./, '')
  byGroup.set(group, [...(byGroup.get(group) ?? []), d])
}
if (process.argv.includes('--shape')) console.log(JSON.stringify(docs.find((d) => d._system) ?? docs[0], null, 2))
for (const [group, list] of byGroup) {
  console.log(group)
  for (const d of list) console.log(`   ${d._id.padEnd(72)} ${String(d.blurb ?? '').slice(0, 52)}`)
}
console.log(`\n${docs.length} documents in ${byGroup.size} groups`)
