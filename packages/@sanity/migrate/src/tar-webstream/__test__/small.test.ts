import {streamAsyncIterator} from '../../utils/streamToAsyncIterator'
import {toArray} from '../../it-utils/toArray'
import {untar} from '../untar'
import {decodeText} from '../../it-utils/decodeText'
import {readFileAsWebStream} from '../../fs-webstream/readFileAsWebStream'

async function* extract(file: string) {
  const fileStream = readFileAsWebStream(file)
  for await (const [header, body] of streamAsyncIterator(untar(fileStream))) {
    const content = await toArray(decodeText(streamAsyncIterator(body)))
    yield [header.name, {type: header.type, content}]
  }
}

test('untar a small file', async () => {
  const values = Object.fromEntries(await toArray(extract(`${__dirname}/fixtures/small.tar`)))

  expect(values).toEqual({
    'a.txt': {
      content: ['a'],
      type: 'file',
    },
    'b.txt': {
      content: ['b'],
      type: 'file',
    },
    'c/': {
      content: [],
      type: 'directory',
    },
    'c/d/': {
      content: [],
      type: 'directory',
    },
    'c/d/e/': {
      content: [],
      type: 'directory',
    },
    'c/d/e/f.txt': {
      content: ['f'],
      type: 'file',
    },
    'c/g.txt': {
      content: ['g'],
      type: 'file',
    },
  })
})
