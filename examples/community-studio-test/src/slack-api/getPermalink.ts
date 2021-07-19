import {map, tap} from 'rxjs/operators'
import {callApi} from './callApi'

export function getSlackPermalink(token: string, channel: string, timestamp: string) {
  return callApi('chat.getPermalink', token, {
    channel,
    message_ts: timestamp,
  }).pipe(
    tap(res => console.log(res.data)),
    map((response: any) => response.data.permalink),
  )
}
