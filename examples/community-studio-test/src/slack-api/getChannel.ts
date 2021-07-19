import {map} from 'rxjs/operators'
import {callApi} from './callApi'

export function getSlackChannelInfo(token: string, channelId: string) {
  return callApi('conversations.info', token, {
    channel: channelId,
  }).pipe(
    map((response: any) => {
      return response.data.channel
    })
  )
}
