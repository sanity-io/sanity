import {map} from 'rxjs/operators'
import {callApi} from './callApi'

export function getSlackUser(token: string, userId: string) {
  return callApi('users.info', token, {
    user: userId,
  }).pipe(
    map((response: any) => {
      return response.data.user
    })
  )
}
