import {merge, type Observable, of} from 'rxjs'
import {delay, mapTo} from 'rxjs/operators'

import {isDev} from '../../../environment'

/**
 * @internal
 */
export type WaitMessage = {messageKey: string} | {message: string}

/**
 * @internal
 */
export function getWaitMessages(path: string[]): Observable<WaitMessage> {
  const thresholds: (WaitMessage & {ms: number})[] = [
    {ms: 300, messageKey: 'panes.resolving.default-message'},
    {ms: 5000, messageKey: 'panes.resolving.slow-resolve-message'},
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

  return merge(
    ...thresholds.map((threshold) =>
      src.pipe(
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        mapTo(
          'messageKey' in threshold
            ? {messageKey: threshold.messageKey}
            : {message: threshold.message},
        ),
        delay(threshold.ms),
      ),
    ),
  )
}
