import {maybeDecompress} from '../fs-webstream/maybeDecompress'

import {untar} from '../tar-webstream/untar'
import {streamAsyncIterator} from '../utils/streamToAsyncIterator'
import {readFileAsWebStream} from '../fs-webstream/readFileAsWebStream'

export async function* fromExportArchive(path: string) {
  for await (const [header, entry] of streamAsyncIterator(
    untar(await maybeDecompress(readFileAsWebStream(path))),
  )) {
    if (header.type === 'file' && header.name.endsWith('.ndjson')) {
      for await (const chunk of streamAsyncIterator(entry)) {
        yield chunk
      }
    }
  }
}
