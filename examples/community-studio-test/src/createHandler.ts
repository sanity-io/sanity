import {IncomingHttpHeaders, IncomingMessage, ServerResponse} from 'http'
import {from, of} from 'rxjs'
import {map, mergeMap, tap} from 'rxjs/operators'
import {handleMessage} from './handleMessage'
import {Secrets} from './types'
import {readRequestBody} from './utils/readRequestBody'

// tslint:disable-next-line:no-console
const log: typeof console.log = (...args: any[]) => console.log(...args)

export const createHandler = (secrets: Secrets) => (
  request: IncomingMessage,
  res: ServerResponse,
) => {
  if (request.method !== 'POST') {
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end('Nothing to see here')
    return
  }

  log('%s %s', request.method, request.url)

  from(readRequestBody(request))
    .pipe(
      map(body => JSON.parse(body.toString())),
      tap(params => {
        log('Got event %s', JSON.stringify(params))
      }),
      mergeMap(handleMessage(secrets)),
      tap(response => {
        res.writeHead(response.status, response.headers)
        res.end(response.body)
      }),
    )
    .subscribe({
      // tslint:disable-next-line:no-console
      error: console.error,
    })
}
