import {maybeDecompress} from '../fs-webstream/maybeDecompress'
import {readFileAsWebStream} from '../fs-webstream/readFileAsWebStream'
import {drain} from '../tar-webstream/drain'
import {untar} from '../tar-webstream/untar'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'

export async function* fromExportArchive(path: string) {
  for await (const [header, entry] of streamToAsyncIterator(
    untar(await maybeDecompress(readFileAsWebStream(path))),
  )) {
    if (header.type === 'file' && header.name.endsWith('.ndjson')) {
      for await (const chunk of streamToAsyncIterator(entry)) {
        yield chunk
      }
    } else {
      // It's not ndjson, so drain the entry stream, so we can move on with the next entry
      await drain(entry)
    }
  }
}
