import {callApi} from './callApi'
import {map} from 'rxjs/operators'

export function getSlackThread(token: string, channel: string, timestamp: string) {
  return callApi('conversations.replies', token, {
    channel,
    ts: timestamp
  }).pipe(
    map((response: any) => {
      console.log(response.data)
      return response.data.messages
    })
  )
}
