import {maybeDecompress} from '../fs-webstream/maybeDecompress'

import {untar} from '../tar-webstream/untar'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {readFileAsWebStream} from '../fs-webstream/readFileAsWebStream'

export async function* fromExportArchive(path: string) {
  for await (const [header, entry] of streamToAsyncIterator(
    untar(await maybeDecompress(readFileAsWebStream(path))),
  )) {
    if (header.type === 'file' && header.name.endsWith('.ndjson')) {
      for await (const chunk of streamToAsyncIterator(entry)) {
        yield chunk
      }
    }
  }
}
