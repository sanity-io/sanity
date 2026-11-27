// Runtime half of `@repo/test-dts-exports/test/v7-exports-on-v6.test.ts`: every runtime value a v7
// entry exports must be importable from the same entry here, so a plugin built against v7 links
// against v6 too.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {test} from 'node:test'

const v7ExportMap = JSON.parse(
  await readFile(
    new URL('../../test-dts-exports/v7-export-map/v7-export-map.json', import.meta.url),
    'utf8',
  ),
)

for (const [entry, names] of Object.entries(v7ExportMap)) {
  void test(`${entry} exports the runtime values of its v7 counterpart`, async () => {
    const module = await import(entry)
    const missing = Object.entries(names)
      .filter(([name, kind]) => kind === 'value' && !(name in module))
      .map(([name]) => name)
    assert.deepEqual(missing, [], `${entry} is missing runtime exports that v7 has`)
  })
}
