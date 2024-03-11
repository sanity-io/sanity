import {expect, test} from 'vitest'

import {decodeText, parse, toArray} from '../../it-utils'
import {fromExportArchive} from '../fromExportArchive'

test('untar movies dataset export, but not reading assets', async () => {
  const docsFromExport = fromExportArchive(`${__dirname}/fixtures/example.tar.gz`)

  const allDocs = await toArray(parse<{_id: string}>(decodeText(docsFromExport)))

  expect(allDocs.map((doc) => doc._id)).toEqual([
    'e749feed-4a9e-4175-b130-913f28436f62',
    '12274d53-4d6d-4aa4-9ace-d15da7ba7c10',
  ])
})
