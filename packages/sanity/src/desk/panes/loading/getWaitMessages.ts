import {Observable, of, merge} from 'rxjs'
import {mapTo, delay} from 'rxjs/operators'
import {isDev} from 'sanity'

/**
 * @internal
 */
export function getWaitMessages(path: string[]): Observable<string> {
  const thresholds = [
    {ms: 300, message: 'Loading…'},
    {ms: 5000, message: 'Still loading…'},
  ]

  if (isDev) {
    const message = [
      'Check console for errors?',
      'Is your observable/promise resolving?',
      path.length > 0 ? `Structure path: ${path.join(' ➝ ')}` : '',
    ]

    thresholds.push({
      ms: 10000,
      message: message.join('\n'),
    })
  }

  const src = of(null)

  return merge(...thresholds.map(({ms, message}) => src.pipe(mapTo(message), delay(ms))))
}
